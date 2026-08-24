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
import { EVENTS, SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { VEHICLE_CONSTANTS } from "@/constants/vehicles";
import { useScrollRestore } from "./useScrollRestore";

/**
 * Convierte el objeto de filtros (formato parseFilters) a params planos
 * aptos para analytics: strings y números, sin arrays anidados ni claves
 * con acentos, para que GTM pueda leerlos directamente como dimensiones.
 */
function buildFiltersAnalyticsParams(filters) {
  const out = {};
  if (filters.marca?.length) out.marca = filters.marca.join(",");
  if (filters.caja?.length) out.caja = filters.caja.join(",");
  if (filters.combustible?.length) out.combustible = filters.combustible.join(",");
  if (filters.precio?.length === 2) {
    const [min, max] = filters.precio;
    if (Number.isFinite(min)) out.precio_min = min;
    if (Number.isFinite(max)) out.precio_max = max;
  }
  if (filters.año?.length === 2) {
    const [min, max] = filters.año;
    if (Number.isFinite(min)) out.anio_min = min;
    if (Number.isFinite(max)) out.anio_max = max;
  }
  if (filters.kilometraje?.length === 2) {
    const [, max] = filters.kilometraje;
    if (Number.isFinite(max)) out.km_max = max;
  }
  out.filters_count = Object.keys(out).length;
  return out;
}

/**
 * Hook que encapsula toda la lógica de datos de /usados/vehiculos:
 * - Parseo de URL (filtros, página, sort)
 * - Fetch y acumulación de vehículos
 * - Ordenamiento client-side
 * - Persistencia en sessionStorage para scroll restore
 * - Analytics (tracking items, filter/sort events)
 *
 * El componente se limita a renderizar UI y manejar estado visual
 * (dropdown abierto, panel de filtros, etc.)
 */
export function useVehiclesList({ initialData, initialError = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(initialError);

  const filtersAbortRef = useRef(null);
  const loadMoreLockRef = useRef(false);

  // Prefetch caché: { cursor, filtersKey, mappedData } | null
  const prefetchCacheRef = useRef(null);
  // AbortController para el fetch de prefetch en vuelo
  const prefetchAbortRef = useRef(null);
  // ID del idle callback (o del setTimeout fallback en Safari)
  const prefetchIdleRef = useRef(null);

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
      page: Number(searchParams.get("page")) || 1,
      sort: isValidSortOption(searchParams.get("sort"))
        ? searchParams.get("sort")
        : null,
    };
  }, [searchParams]);

  const currentFilters = searchParamsData.filters;
  const currentPage = searchParamsData.page;
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

  const sortedVehicles = useMemo(() => {
    if (!currentSort) return data.vehicles || [];
    return sortVehicles(data.vehicles || [], currentSort);
  }, [data.vehicles, currentSort]);

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

      // Invalidar caché de prefetch: los datos son de otro contexto de filtros.
      prefetchAbortRef.current?.abort();
      prefetchCacheRef.current = null;

      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);

      updateURL(newFilters, 1, undefined, addToHistory);

      try {
        const backendData = await vehiclesService.getVehicles({
          filters: newFilters,
          limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
          cursor: 1,
          signal: ac.signal,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        setData(mappedData);

        const resultsCount = mappedData.total ?? 0;
        const filtersAnalytics = buildFiltersAnalyticsParams(newFilters);

        pushDataLayer(EVENTS.FILTER_APPLIED, {
          location: LOCATIONS.USADOS_LIST,
          component_id: "filter-form-vehiculos",
          results_count: resultsCount,
          ...filtersAnalytics,
        });

        // view_search_results solo cuando hay filtros activos — si el
        // usuario limpió todos los filtros no es una búsqueda.
        if (hasAnyFilter(newFilters)) {
          pushDataLayer(EVENTS.VIEW_SEARCH_RESULTS, {
            search_term: filtersAnalytics.marca || "usados_filtros",
            results_count: resultsCount,
            location: LOCATIONS.USADOS_LIST,
            filters_count: filtersAnalytics.filters_count,
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
        if (process.env.NODE_ENV === "development") {
          console.error("[useVehiclesList] Error fetching vehicles:", err);
        }
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
        setError(err.message || "Error al cargar vehículos");
      } finally {
        if (!ac.signal.aborted) setIsLoading(false);
      }
    },
    [updateURL],
  );

  const loadMore = useCallback(async () => {
    if (loadMoreLockRef.current) return;
    if (!data?.hasNextPage) return;

    const nextPage = data?.nextPage;
    if (!nextPage) return;

    loadMoreLockRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    // Cancelar el prefetch en vuelo: ya no hace falta, loadMore toma el control.
    prefetchAbortRef.current?.abort();

    try {
      // ── Cache hit: el prefetch ya trajo los datos ──────────────────────────
      const cached = prefetchCacheRef.current;
      const hasCacheHit =
        cached &&
        cached.cursor === nextPage &&
        cached.paramsFingerprint === searchParamsFingerprint;

      let mappedData;
      if (hasCacheHit) {
        mappedData = cached.mappedData;
        prefetchCacheRef.current = null; // consumir: no reutilizar
      } else {
        // ── Cache miss: fetch normal ──────────────────────────────────────────
        const backendData = await vehiclesService.getVehicles({
          filters: currentFilters,
          limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
          cursor: nextPage,
        });
        mappedData = mapVehiclesPage(backendData, nextPage);
      }

      setData((prevData) => {
        const existingIds = new Set(
          (prevData.vehicles || []).map((v) => v.id),
        );
        const newVehicles = (mappedData.vehicles || []).filter(
          (v) => v.id && !existingIds.has(v.id),
        );

        return {
          vehicles: [...(prevData.vehicles || []), ...newVehicles],
          total: mappedData.total || prevData.total || 0,
          hasNextPage: mappedData.hasNextPage,
          nextPage: mappedData.nextPage,
          currentCursor: mappedData.currentCursor,
          totalPages: mappedData.totalPages || prevData.totalPages || 0,
        };
      });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[useVehiclesList] Error fetching more vehicles:", err);
      }
      sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
      setError(err.message || "Error al cargar más vehículos");
    } finally {
      loadMoreLockRef.current = false;
      setIsLoadingMore(false);
    }
  }, [currentFilters, data]);

  /**
   * Cambia sort → actualiza URL (page=1) + dispara analytics.
   * NO maneja UI (cerrar dropdown) — eso es responsabilidad del componente.
   */
  const changeSort = useCallback(
    (newSort) => {
      updateURL(currentFilters, 1, newSort);
      pushDataLayer(EVENTS.SORT_APPLIED, {
        location: LOCATIONS.USADOS_LIST,
        sort_value: newSort ?? "none",
      });
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

  // --- Prefetch de siguiente página ------------------------------------------
  //
  // 150ms después de que los datos se renderizan, se inicia un fetch silencioso
  // de la siguiente página. Si el usuario hace click en "Cargar más" y la caché
  // está lista, los datos se aplican de inmediato.
  //
  // Por qué searchParamsFingerprint (string) en lugar de currentFilters (objeto):
  // React compara deps por referencia. useMemo puede crear un nuevo objeto de
  // filtros aunque el URL no cambie, lo que reiniciaría el timer en cada render.
  // Un string siempre compara por valor → el effect solo se reinicia si el URL
  // realmente cambia.
  //
  // Invariantes de seguridad:
  //  · Se cancela al cambiar URL, al desmontar el componente, o al usar la caché.
  //  · Fallo silencioso: loadMore hace el fetch normal sin degradar la UX.
  //  · La caché se invalida al consumirla (no se reutiliza entre páginas o contextos).

  useEffect(() => {
    if (!data.hasNextPage || !data.nextPage) {
      prefetchCacheRef.current = null;
      return;
    }

    const nextPage = data.nextPage;
    const paramsFingerprint = searchParamsFingerprint;

    // Cancelar prefetch anterior (timer o fetch en vuelo).
    prefetchAbortRef.current?.abort();
    prefetchCacheRef.current = null;
    clearTimeout(prefetchIdleRef.current);

    const doPrefetch = async () => {
      const ac = new AbortController();
      prefetchAbortRef.current = ac;

      try {
        const backendData = await vehiclesService.getVehicles({
          filters: currentFilters,
          limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
          cursor: nextPage,
          signal: ac.signal,
        });

        if (ac.signal.aborted) return;

        const mappedData = mapVehiclesPage(backendData, nextPage);
        prefetchCacheRef.current = { cursor: nextPage, paramsFingerprint, mappedData };
      } catch {
        // Fallo silencioso: loadMore hará el fetch normal.
        prefetchCacheRef.current = null;
      }
    };

    prefetchIdleRef.current = setTimeout(doPrefetch, 150);

    return () => {
      prefetchAbortRef.current?.abort();
      prefetchCacheRef.current = null;
      clearTimeout(prefetchIdleRef.current);
    };
  }, [data.hasNextPage, data.nextPage, searchParamsFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Analytics computed ----------------------------------------------------

  const trackingItems = useMemo(
    () =>
      sortedVehicles
        .map((v) => buildItemParamsFromUsado(v, ITEM_LIST.USADOS_GRID))
        .filter(Boolean),
    [sortedVehicles],
  );

  const listSignature = useMemo(
    () => `${currentSort || ""}|${searchParams?.toString?.() || ""}`,
    [currentSort, searchParams],
  );

  // --- Public API ------------------------------------------------------------

  return {
    data,
    sortedVehicles,
    isLoading,
    isLoadingMore,
    error,
    setError,

    currentFilters,
    currentPage,
    currentSort,

    isFiltered,
    selectedBrands,
    activeFilterChips,

    applyFilters,
    loadMore,
    changeSort,
    clearFilters,
    selectBrand,

    trackingItems,
    listSignature,
  };
}
