"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildSearchParams,
  parseFilters,
  sortVehicles,
  hasAnyFilter,
  getActiveFilterChips,
  isValidSortOption,
} from "@/utils/filters";
import { vehiclesService } from "@/lib/services/vehiclesApi";
import { mapVehiclesPage } from "@/lib/mappers/vehicleMapper";
import { EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/dataLayer";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { VEHICLE_CONSTANTS, LIST_ERROR_MESSAGE } from "@/constants/vehicles";
import { vendidosAlFinal } from "@/utils/vehicleEstado";
import { createLogger } from "@/lib/logger";
import { useScrollRestore } from "./useScrollRestore";

const log = createLogger("usados:listado");

/**
 * Lo que viaja en view_search_results: cuántos filtros se usaron y la marca.
 * Cuenta lo mismo que va a la URL: los rangos en su valor por defecto no son
 * un filtro (el formulario los manda siempre y los inflaba en +3).
 */
function buildSearchEventParams(filters) {
  const usados = [...buildSearchParams(filters).keys()].filter((k) => k !== "page" && k !== "sort");
  return {
    filters_count: new Set(usados).size,
    marca: filters.marca?.length ? filters.marca.join(",") : undefined,
  };
}

/**
 * Hook que encapsula toda la lógica de datos de /usados/vehiculos:
 * - Parseo de URL (filtros, sort)
 * - Fetch de TODOS los autos que cumplen el filtro y paginado en pantalla
 * - Ordenamiento client-side, con los vendidos al final de todo el listado
 * - Persistencia en sessionStorage para scroll restore
 * - Analytics (view_search_results al filtrar)
 *
 * Por qué se trae todo y se pagina acá: los vendidos tienen que quedar al
 * final del listado completo, y el backend no ordena ni filtra por estado.
 * Pidiendo de a páginas no hay forma de saber dónde están. "Cargar más" solo
 * muestra LIST_PAGE_SIZE autos más de lo ya recibido (ver LIST_FETCH_LIMIT).
 *
 * `data.visibleCount` es cuántos se muestran. Vive dentro de `data` para que
 * useScrollRestore lo guarde y lo restaure junto con la lista al volver de
 * una ficha.
 *
 * El componente se limita a renderizar UI y manejar estado visual
 * (dropdown abierto, panel de filtros, etc.)
 */
const PAGE_SIZE = VEHICLE_CONSTANTS.LIST_PAGE_SIZE;

export function useVehiclesList({ initialData, initialError = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(() => ({
    ...initialData,
    visibleCount: initialData?.visibleCount || PAGE_SIZE,
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const filtersAbortRef = useRef(null);

  // Guard para el efecto de sincronización URL↔datos.
  // true = omitir la próxima ejecución del efecto (porque el cambio de URL
  // fue iniciado por nosotros vía applyFilters/changeSort, no por back/forward).
  // Se inicializa en true para ignorar la primera ejecución en mount.
  const skipNextSyncRef = useRef(true);

  // --- URL parsing -----------------------------------------------------------

  const searchParamsData = useMemo(() => {
    const sparse = parseFilters(searchParams);
    return {
      filters: sparse,
      sort: isValidSortOption(searchParams.get("sort"))
        ? searchParams.get("sort")
        : null,
    };
  }, [searchParams]);

  const currentFilters = searchParamsData.filters;
  const currentSort = searchParamsData.sort;

  // --- sessionStorage: guardar + restaurar scroll/datos -----------------------

  const searchParamsFingerprint = searchParams?.toString?.() || "";

  // Fingerprint solo de los filtros (excluye sort y page).
  // Sirve como dep del efecto de sync: sort-only o page-only changes no
  // deben disparar un nuevo fetch — el sort es client-side y page no se
  // expone como param real en la UX actual.
  const filtersFingerprint = useMemo(() => {
    const p = new URLSearchParams(searchParams?.toString?.() || "");
    p.delete("sort");
    p.delete("page");
    const entries = Array.from(p.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return entries.map(([k, v]) => `${k}=${v}`).join("&");
  }, [searchParams]);

  useScrollRestore({ data, setData, searchParamsFingerprint });

  // Sincronización URL ↔ datos: detecta cambios de filtros que provienen
  // de navegación externa (back/forward del browser, link directo con query).
  // En esos casos applyFilters no fue llamado, así que el state no corresponde
  // a la URL y hay que refetchear.
  //
  // Flujo normal (applyFilters):  applyFilters pone skipNextSyncRef=true antes
  // de cambiar la URL → efecto corre → skip → no hay doble fetch.
  // Flujo externo (back/forward): skipNextSyncRef sigue en false → efecto
  // corre → refetch con los filtros actuales de la URL.
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    applyFilters(currentFilters, { addToHistory: false });
  }, [filtersFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Computed values -------------------------------------------------------

  const isFiltered = useMemo(
    () => hasAnyFilter(currentFilters),
    [currentFilters],
  );

  const selectedBrands = useMemo(
    () => currentFilters.marca || [],
    [currentFilters.marca],
  );

  // Todo el listado ordenado: el orden elegido y los vendidos al final de todo,
  // con o sin filtros. Recién después se corta lo que se muestra.
  const orderedVehicles = useMemo(() => {
    const vehicles = data.vehicles || [];
    return vendidosAlFinal(currentSort ? sortVehicles(vehicles, currentSort) : vehicles);
  }, [data.vehicles, currentSort]);

  const visibleCount = data.visibleCount || PAGE_SIZE;

  const sortedVehicles = useMemo(
    () => orderedVehicles.slice(0, visibleCount),
    [orderedVehicles, visibleCount],
  );

  // hasNextPage ahora significa "quedan autos recibidos sin mostrar".
  const listData = useMemo(
    () => ({ ...data, hasNextPage: visibleCount < orderedVehicles.length }),
    [data, visibleCount, orderedVehicles.length],
  );

  const activeFilterChips = useMemo(
    () => getActiveFilterChips(currentFilters),
    [currentFilters],
  );

  // --- URL update ------------------------------------------------------------

  /**
   * Contrato de `newSort`:
   *   - string válido ("precio_asc")  → ?sort=...
   *   - null                           → elimina ?sort
   *   - undefined (omitido)            → preserva el sort actual
   *
   * `addToHistory`: si true usa router.push (back deshace la navegación),
   * si false (default) usa router.replace (no agrega al historial).
   * Usar push solo en acciones intencionales del usuario (ej: "Aplicar" filtros).
   */
  const updateURL = useCallback(
    (newFilters, newPage = null, newSort = undefined, addToHistory = false) => {
      const params = buildSearchParams(newFilters);

      if (newPage !== null && newPage > 1) {
        params.set("page", String(newPage));
      } else if (newPage === 1) {
        params.delete("page");
      }

      if (typeof newSort === "string" && newSort) {
        params.set("sort", newSort);
      } else if (newSort === null) {
        params.delete("sort");
      }
      if (newSort === undefined && currentSort) {
        params.set("sort", currentSort);
      }

      const qs = params.toString();
      const href = `/usados/vehiculos${qs ? `?${qs}` : ""}`;
      if (addToHistory) {
        router.push(href);
      } else {
        router.replace(href);
      }
    },
    [router, currentSort],
  );

  // --- Handlers --------------------------------------------------------------

  const applyFilters = useCallback(
    async (newFilters, { addToHistory = false } = {}) => {
      // Marcar antes de cambiar la URL: el efecto de sync debe ignorar
      // este cambio porque ya lo estamos manejando acá.
      skipNextSyncRef.current = true;

      filtersAbortRef.current?.abort();
      const ac = new AbortController();
      filtersAbortRef.current = ac;

      setIsLoading(true);
      setError(null);

      updateURL(newFilters, 1, undefined, addToHistory);

      try {
        const backendData = await vehiclesService.getVehicles({
          filters: newFilters,
          limit: VEHICLE_CONSTANTS.LIST_FETCH_LIMIT,
          cursor: 1,
          signal: ac.signal,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        if (mappedData.hasNextPage) {
          log.warn(
            `El inventario filtrado supera ${VEHICLE_CONSTANTS.LIST_FETCH_LIMIT} autos: ` +
              "los vendidos quedan al final solo de lo recibido.",
          );
        }
        setData({ ...mappedData, visibleCount: PAGE_SIZE });

        // Solo con filtros activos: limpiar todos los filtros no es una búsqueda.
        if (hasAnyFilter(newFilters)) {
          track(EVENTS.VIEW_SEARCH_RESULTS, {
            results_count: mappedData.total ?? 0,
            ...buildSearchEventParams(newFilters),
          });
        }

        const savedPosition = sessionStorage.getItem(
          STORAGE_KEYS.VEHICLES_SCROLL_POSITION,
        );
        if (savedPosition) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: Number(savedPosition),
                behavior: "smooth",
              });
              sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
            });
          });
        }
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        log.error("No se pudo cargar el listado:", err?.message || err);
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
        setError(LIST_ERROR_MESSAGE);
      } finally {
        if (!ac.signal.aborted) setIsLoading(false);
      }
    },
    [updateURL],
  );

  // Muestra PAGE_SIZE autos más de los ya recibidos. No le pide nada al
  // backend: el listado completo ya está cargado.
  const loadMore = useCallback(() => {
    setData((prev) => {
      const current = prev.visibleCount || PAGE_SIZE;
      const total = (prev.vehicles || []).length;
      if (current >= total) return prev;
      return { ...prev, visibleCount: current + PAGE_SIZE };
    });
  }, []);

  /**
   * Cambia sort → actualiza URL (page=1).
   * NO maneja UI (cerrar dropdown) — eso es responsabilidad del componente.
   */
  const changeSort = useCallback(
    (newSort) => {
      updateURL(currentFilters, 1, newSort);
    },
    [currentFilters, updateURL],
  );

  const clearFilters = useCallback(() => {
    const scrollPosition = window.scrollY || window.pageYOffset;
    sessionStorage.setItem(
      STORAGE_KEYS.VEHICLES_SCROLL_POSITION,
      String(scrollPosition),
    );
    applyFilters({});
  }, [applyFilters]);

  const selectBrand = useCallback(
    (brandName) => {
      const currentBrands = currentFilters.marca || [];
      const isSelected = currentBrands.includes(brandName);

      const newBrands = isSelected
        ? currentBrands.filter((b) => b !== brandName)
        : [...currentBrands, brandName];

      applyFilters({
        ...currentFilters,
        marca: newBrands.length > 0 ? newBrands : undefined,
      });
    },
    [currentFilters, applyFilters],
  );

  // --- Public API ------------------------------------------------------------

  return {
    data: listData,
    sortedVehicles,
    isLoading,
    error,
    setError,

    currentFilters,
    currentSort,

    isFiltered,
    selectedBrands,
    activeFilterChips,

    applyFilters,
    loadMore,
    changeSort,
    clearFilters,
    selectBrand,
  };
}
