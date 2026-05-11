"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildSearchParams,
  parseFilters,
  sortVehicles,
  hasAnyFilter,
  getActiveFilterChips,
  isValidSortOption,
} from "../../../../utils/filters";
import { vehiclesService } from "../../../../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../../../../lib/mappers/vehicleMapper";
import { EVENTS, SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";
import { STORAGE_KEYS } from "../../../../constants/storageKeys";
import { VEHICLE_CONSTANTS } from "../../../../constants/vehicles";
import { useScrollRestore } from "./useScrollRestore";

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

  useScrollRestore({ data, setData, searchParamsFingerprint });

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
   */
  const updateURL = useCallback(
    (newFilters, newPage = null, newSort = undefined) => {
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
      router.replace(`/usados/vehiculos${qs ? `?${qs}` : ""}`);
    },
    [router, currentSort],
  );

  // --- Handlers --------------------------------------------------------------

  const applyFilters = useCallback(
    async (newFilters) => {
      filtersAbortRef.current?.abort();
      const ac = new AbortController();
      filtersAbortRef.current = ac;

      setIsLoading(true);
      setIsLoadingMore(false);
      setError(null);

      updateURL(newFilters, 1);

      try {
        const backendData = await vehiclesService.getVehicles({
          filters: newFilters,
          limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
          cursor: 1,
          signal: ac.signal,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        setData(mappedData);

        pushDataLayer(EVENTS.FILTER_APPLIED, {
          location: LOCATIONS.USADOS_LIST,
          filters: newFilters,
          results_count: mappedData.totalDocs ?? mappedData.total ?? 0,
        });

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

    try {
      const backendData = await vehiclesService.getVehicles({
        filters: currentFilters,
        limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
        cursor: nextPage,
      });

      const mappedData = mapVehiclesPage(backendData, nextPage);

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
          totalDocs: mappedData.totalDocs || prevData.totalDocs || 0,
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
