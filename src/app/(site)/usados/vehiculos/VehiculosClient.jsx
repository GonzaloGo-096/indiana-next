"use client";

/**
 * VehiculosClient - Client Component para interactividad
 * 
 * ✅ RESPONSABILIDADES:
 * - Manejo de filtros y paginación (estado en URL)
 * - Actualización de URL con router.push/replace
 * - Renderizado de UI (filtros, grid, paginación)
 * 
 * ✅ ARQUITECTURA:
 * - Estado en URL (searchParams) - única fuente de verdad
 * - No duplica lógica: usa buildSearchParams() de filters.js
 * - Fetch adicional solo si cambian filtros/página
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildSearchParams,
  parseFilters,
  sortVehicles,
  hasAnyFilter,
  getActiveFilterChips,
} from "../../../../utils/filters";
import { vehiclesService } from "../../../../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../../../../lib/mappers/vehicleMapper";
import cta from "@/components/home/HomeSectionCtas.module.css";
import styles from "./vehiculos.module.css";

import dynamic from "next/dynamic";
import AutosGrid from "../../../../components/vehicles/List/ListAutos";
import FilterFormSimple from "../../../../components/vehicles/Filters/FilterFormSimple";
import ActiveFilterChips from "../../../../components/vehicles/Filters/ActiveFilterChips";
import ActionButtons from "../../../../components/vehicles/ActionButtons/ActionButtons";
import { STORAGE_KEYS } from "../../../../constants/storageKeys";
import { VEHICLE_CONSTANTS } from "../../../../constants/vehicles";
import { debugIngest } from "../../../../lib/debugIngestClient";

/** Indicador mínimo (trazo fino, distinto del chevron de MultiSelect) */
function BrandStripNudge({ direction }) {
  const left = direction === "left";
  return (
    <svg
      className="block"
      width="8"
      height="14"
      viewBox="0 0 8 14"
      aria-hidden
    >
      <path
        d={left ? "M6.5 1 L1.5 7 L6.5 13" : "M1.5 1 L6.5 7 L1.5 13"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ✅ Code splitting: BrandsCarousel solo se carga cuando es necesario
const BrandsCarousel = dynamic(
  () => import("../../../../components/vehicles/BrandsCarousel"),
  {
    loading: () => <div style={{ minHeight: "80px" }} />, // Placeholder mínimo
    ssr: false, // ✅ Deshabilitar SSR para evitar conflictos con Suspense
  }
);

/**
 * @param {Object} props
 * @param {Object} props.initialData - Datos iniciales del Server Component
 * @param {Object} props.initialFilters - Filtros iniciales
 * @param {number} props.initialPage - Página inicial
 * @param {string} props.error - Error inicial (opcional)
 */
export default function VehiculosClient({
  initialData,
  initialFilters = {},
  initialPage = 1,
  error: initialError = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado local para datos actuales
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(initialError);
  const [selectedSort, setSelectedSort] = useState(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const filterFormRef = useRef(null);
  const sortButtonRef = useRef(null);
  const sortButtonRefDesktop = useRef(null);
  const brandsCarouselRef = useRef(null);
  const brandsCarouselScrollRestoreRef = useRef(null);
  const [brandsScroll, setBrandsScroll] = useState({
    canScrollLeft: false,
    canScrollRight: true,
  });
  const handleBrandsScrollabilityChange = useCallback((next) => {
    setBrandsScroll(next);
  }, []);

  const [stripFiltersOpen, setStripFiltersOpen] = useState(false);

  useLayoutEffect(() => {
    if (!stripFiltersOpen) return;
    const track = brandsCarouselRef.current?.getTrackElement?.();
    const saved = brandsCarouselScrollRestoreRef.current;
    brandsCarouselScrollRestoreRef.current = null;
    if (!track || saved == null) return;
    track.scrollLeft = saved;
  }, [stripFiltersOpen]);

  // ✅ OPTIMIZADO: Extraer todos los valores de searchParams en un solo useMemo
  // Esto reduce múltiples re-renders y puede ayudar con el error de Suspense
  // ⚠️ NO mergear con FILTER_DEFAULTS: si el usuario no filtró, dejamos los
  // filtros "ralos". Eso evita que vehiclesService.getVehicles mande precio/km
  // al backend y filtre autos que tendrían que aparecer. FilterFormSimple ya
  // se encarga de mostrar los sliders en sus extremos cuando no hay valor.
  const searchParamsData = useMemo(() => {
    const sparse = parseFilters(searchParams);
    return {
      filters: sparse,
      page: Number(searchParams.get("page")) || 1,
      sort: searchParams.get("sort") || null,
    };
  }, [searchParams]);

  const currentFilters = searchParamsData.filters;
  const currentPage = searchParamsData.page;
  const currentSort = searchParamsData.sort;

  // ✅ Guardar lista acumulada de vehículos en sessionStorage cuando cambia
  // Permite restaurar páginas cargadas via infinite scroll al volver desde detalle
  // ✅ CRÍTICO: No guardar si hay scroll pendiente de restaurar — evita sobreescribir
  //    los datos guardados (p.ej. 64 autos) con los datos del server (p.ej. 8 autos)
  //    antes de que el efecto de restauración los lea.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!data.vehicles || data.vehicles.length === 0) return;
    if (sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL)) return;
    try {
      sessionStorage.setItem(STORAGE_KEYS.VEHICLES_LIST_DATA, JSON.stringify(data));
    } catch {
      // Ignorar errores de cuota
    }
  }, [data]);

  // ✅ Restaurar posición de scroll y lista de vehículos al volver desde detalle
  // ✅ IMPORTANTE: Se ejecuta DESPUÉS de ScrollToTopOnMount
  // Orden: Scroll al top (ScrollToTopOnMount) → Restaurar datos → Restaurar scroll
  useEffect(() => {
    if (typeof window === "undefined") return;

    debugIngest({
      hypothesisId: "E",
      location: "VehiculosClient.jsx:useEffect[]",
      message: "useEffect[] FIRED - componente montado",
      data: {
        scrollY: window.scrollY,
        savedScroll: sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL),
        savedDataKeys: sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_DATA)
          ? "present"
          : "absent",
        t: Date.now(),
      },
    });

    const restoreScrollAndData = () => {
      try {
        const savedScrollRaw = sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
        if (!savedScrollRaw) return;

        const scrollData = JSON.parse(savedScrollRaw);
        const isRecent = scrollData.timestamp &&
          (Date.now() - scrollData.timestamp) < VEHICLE_CONSTANTS.SCROLL_DATA_MAX_AGE;

        if (scrollData.path !== "/usados/vehiculos" || !isRecent) {
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
          return;
        }

        // ✅ Restaurar lista acumulada si hay más de una página cargada
        let dataRestored = false;
        const savedListRaw = sessionStorage.getItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
        if (savedListRaw) {
          try {
            const savedList = JSON.parse(savedListRaw);
            if (savedList?.vehicles?.length > 0) {
              debugIngest({
                hypothesisId: "E",
                location: "VehiculosClient.jsx:restoreData",
                message: "restaurando lista de vehículos",
                data: {
                  vehiculosGuardados: savedList.vehicles.length,
                  vehiculosActuales: data.vehicles?.length,
                  scrollTarget: scrollData.position,
                },
              });
              setData(savedList);
              dataRestored = true;
            }
          } catch {}
        }

        // ✅ Esperar a que React renderice los vehículos restaurados antes de scrollear
        // Si se restauraron datos: 600ms (React necesita re-renderizar + browser repintar)
        // Si no: 300ms (contenido ya estaba listo)
        const scrollDelay = dataRestored ? 600 : 300;

        setTimeout(() => {
          debugIngest({
            hypothesisId: "E",
            location: "VehiculosClient.jsx:scrollTo",
            message: "ejecutando scrollTo",
            data: {
              targetPosition: scrollData.position,
              pageHeight: document.body.scrollHeight,
              dataRestored,
              scrollDelay,
            },
          });
          window.scrollTo({ top: scrollData.position, behavior: "instant" });
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
        }, scrollDelay);

      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error al restaurar scroll:", error);
        }
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_DATA);
      }
    };

    // ✅ Pequeño delay inicial para que ScrollToTopOnMount corra primero
    const timeoutId = setTimeout(restoreScrollAndData, VEHICLE_CONSTANTS.SCROLL_RESTORE_TIMEOUT);
    return () => clearTimeout(timeoutId);
  }, []); // Solo ejecutar una vez al montar

  // Sincronizar sorting con URL
  useEffect(() => {
    setSelectedSort(currentSort);
  }, [currentSort]);

  // Verificar si hay filtros activos
  const isFiltered = useMemo(() => {
    const result = hasAnyFilter(currentFilters);
    debugIngest({
      hypothesisId: "C",
      location: "VehiculosClient.jsx:isFiltered",
      message: "isFiltered calculado",
      data: {
        currentFilters,
        isFiltered: result,
        tienePageEnFiltros: "page" in currentFilters,
      },
    });
    return result;
  }, [currentFilters]);

  // Marcas seleccionadas
  const selectedBrands = useMemo(() => {
    return currentFilters.marca || [];
  }, [currentFilters.marca]);

  // Vehículos ordenados (si hay sorting)
  const sortedVehicles = useMemo(() => {
    if (!currentSort) return data.vehicles || [];
    return sortVehicles(data.vehicles || [], currentSort);
  }, [data.vehicles, currentSort]);

  /**
   * Actualizar URL con nuevos filtros/página
   */
  const updateURL = useCallback(
    (newFilters, newPage = null, newSort = null) => {
      const params = buildSearchParams(newFilters);

      // Agregar página si se especifica
      if (newPage !== null && newPage > 1) {
        params.set("page", String(newPage));
      } else if (newPage === 1) {
        params.delete("page"); // No incluir page=1 en URL
      }

      // Agregar sorting si se especifica
      if (newSort) {
        params.set("sort", newSort);
      } else if (newSort === null && currentSort) {
        params.delete("sort"); // Remover sorting si se limpia
      }

      // Actualizar URL (replace para no agregar al historial)
      const newURL = `/usados/vehiculos${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newURL);
    },
    [router, currentSort]
  );

  /**
   * Aplicar filtros
   * ✅ REEMPLAZA vehículos (nuevos filtros = nueva búsqueda)
   * ✅ Restaura posición de scroll si hay una guardada
   */
  const handleApplyFilters = useCallback(
    async (newFilters) => {
      setIsLoading(true);
      setIsLoadingMore(false); // Reset loading more
      setError(null);

      // Actualizar URL (resetear a página 1)
      updateURL(newFilters, 1, currentSort);

      debugIngest({
        hypothesisId: "D",
        location: "VehiculosClient.jsx:handleApplyFilters",
        message: "filtros aplicados - URL actualizada, iniciando fetch",
        data: { newFilters, currentSort, currentFiltersAntesDeFetch: currentFilters },
      });

      // Fetch desde cliente
      try {
        const backendData = await vehiclesService.getVehicles({
          filters: newFilters,
          limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
          cursor: 1,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        // ✅ REEMPLAZAR vehículos (nuevos filtros)
        setData(mappedData);
        
        // ✅ Restaurar posición de scroll si hay una guardada (p. ej. al limpiar todos los filtros)
        const savedPosition = sessionStorage.getItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
        if (savedPosition) {
          // ✅ Usar doble requestAnimationFrame para mejor sincronización con el DOM
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: Number(savedPosition),
                behavior: 'smooth'
              });
              // Limpiar después de restaurar
              sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
            });
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("[VehiculosClient] Error fetching vehicles:", err);
        }
        // ✅ Limpiar sessionStorage en caso de error
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
        setError(err.message || "Error al cargar vehículos");
      } finally {
        setIsLoading(false);
      }
    },
    [updateURL, currentSort]
  );

  const handleRemoveOneFilterChip = useCallback(
    (nextFilters) => {
      handleApplyFilters(nextFilters);
    },
    [handleApplyFilters]
  );

  const handleClearSortOnly = useCallback(() => {
    updateURL(currentFilters, currentPage, null);
    setSelectedSort(null);
    setIsSortDropdownOpen(false);
  }, [currentFilters, currentPage, updateURL]);

  const activeFilterChips = useMemo(
    () => getActiveFilterChips(currentFilters),
    [currentFilters]
  );

  /**
   * Cargar más vehículos (infinite scroll)
   * ✅ ACUMULA vehículos en lugar de reemplazarlos
   * ✅ NO actualiza URL para evitar scroll hacia arriba
   * ✅ FILTRA duplicados basándose en ID del vehículo
   * ✅ USA data.nextPage del backend (fuente de verdad para paginación)
   */
  const handleLoadMore = useCallback(
    async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("[VehiculosClient] handleLoadMore llamado", { 
          isLoadingMore, 
          hasNextPage: data?.hasNextPage, 
          nextPage: data?.nextPage
        });
      }
      
      if (isLoadingMore) return;
      if (!data?.hasNextPage) return;

      setIsLoadingMore(true);
      setError(null);

      // ✅ CRÍTICO: Usar data.nextPage del backend
      const nextPage = data?.nextPage;
      
      if (!nextPage) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("[VehiculosClient] No hay nextPage disponible aunque hasNextPage es true", { data });
        }
        setIsLoadingMore(false);
        return;
      }

      // Fetch desde cliente
      try {
        const backendData = await vehiclesService.getVehicles({
          filters: currentFilters,
          limit: VEHICLE_CONSTANTS.LIST_PAGE_SIZE,
          cursor: nextPage,
        });
        
        const mappedData = mapVehiclesPage(backendData, nextPage);
        
        // ✅ ACUMULAR vehículos filtrando duplicados por ID
        // ✅ PRESERVAR hasNextPage y nextPage de la nueva página cargada
        setData((prevData) => {
          const existingIds = new Set((prevData.vehicles || []).map(v => v.id));
          const newVehicles = (mappedData.vehicles || []).filter(v => v.id && !existingIds.has(v.id));
          
          const prevVehicles = prevData.vehicles || [];
          const accumulatedVehicles = [...prevVehicles, ...newVehicles];
          
          const newData = {
            vehicles: accumulatedVehicles, // ✅ PRIMERO: establecer vehículos acumulados
            total: mappedData.total || prevData.total || 0,
            totalDocs: mappedData.totalDocs || prevData.totalDocs || 0,
            hasNextPage: mappedData.hasNextPage,
            nextPage: mappedData.nextPage, // ✅ Confiar en el mapper para validación
            currentCursor: mappedData.currentCursor,
            totalPages: mappedData.totalPages || prevData.totalPages || 0,
          };
          
          return newData;
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("[VehiculosClient] Error fetching more vehicles:", err);
        }
        // ✅ Limpiar sessionStorage en caso de error
        sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION);
        setError(err.message || "Error al cargar más vehículos");
      } finally {
        setIsLoadingMore(false);
      }
    },
    [currentFilters, data, isLoadingMore] // ✅ Incluir data en dependencias para tener el valor actualizado
  );

  /**
   * Cambiar sorting
   */
  const handleSortChange = useCallback(
    (newSort) => {
      // Solo actualizar URL (sorting es local, no requiere fetch)
      updateURL(currentFilters, currentPage, newSort);
      setIsSortDropdownOpen(false);
    },
    [currentFilters, currentPage, updateURL]
  );

  /**
   * Limpiar filtros y restaurar posición de scroll
   * ✅ Guarda la posición de scroll actual antes de limpiar
   * ✅ La posición se restaurará automáticamente en handleApplyFilters
   */
  const handleClearFilters = useCallback(() => {
    // ✅ Guardar posición de scroll actual antes de limpiar filtros
    const scrollPosition = window.scrollY || window.pageYOffset;
    sessionStorage.setItem(STORAGE_KEYS.VEHICLES_SCROLL_POSITION, String(scrollPosition));
    
    // Limpiar filtros (handleApplyFilters restaurará el scroll automáticamente)
    handleApplyFilters({});
  }, [handleApplyFilters]);

  /**
   * Seleccionar marca desde carrusel
   */
  const handleBrandSelect = useCallback(
    (brandName) => {
      const currentBrands = currentFilters.marca || [];
      const isSelected = currentBrands.includes(brandName);
      
      const newBrands = isSelected
        ? currentBrands.filter((b) => b !== brandName)
        : [...currentBrands, brandName];

      handleApplyFilters({
        ...currentFilters,
        marca: newBrands.length > 0 ? newBrands : undefined,
      });
    },
    [currentFilters, handleApplyFilters]
  );

  /**
   * Toggle filtros (mobile/desktop)
   */
  const handleFilterClick = useCallback(() => {
    const track = brandsCarouselRef.current?.getTrackElement?.();
    brandsCarouselScrollRestoreRef.current =
      track != null ? track.scrollLeft : null;
    filterFormRef.current?.toggleFilters();
  }, []);

  /**
   * Toggle sort dropdown
   */
  const handleSortClick = useCallback(() => {
    setIsSortDropdownOpen((prev) => !prev);
  }, []);

  /**
   * Cerrar sort dropdown
   */
  const handleCloseSortDropdown = useCallback(() => {
    setIsSortDropdownOpen(false);
  }, []);

  const isSortDisabled = isLoading || (data.vehicles || []).length === 0;

  const showBrandScrollArrows = useMemo(() => {
    return brandsScroll.canScrollLeft || brandsScroll.canScrollRight;
  }, [brandsScroll.canScrollLeft, brandsScroll.canScrollRight]);

  return (
    <div className={`${styles.page} w-full min-w-0 antialiased`}>
      <div className={`${styles.backRow} w-full min-w-0`}>
        <Link
          href="/usados"
          className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline}`}
          aria-label="Volver a usados"
        >
          Atrás
        </Link>
      </div>
      <div className={`${styles.titleContainer} w-full min-w-0`}>
        <div className={`${styles.titleSection} w-full min-w-0`}>
          <h1
            className={`${styles.mainTitle} text-balance`}
            id="vehiculos-lista-titulo"
          >
            Nuestros Usados
          </h1>
        </div>
      </div>

      <div
        className={`${styles.toolbarRegion} w-full min-w-0 ${
          stripFiltersOpen ? styles.toolbarRegion_filtersOpen : ""
        }`}
        aria-labelledby="vehiculos-lista-titulo"
      >
        <div className={`${styles.carouselSection} w-full min-w-0`}>
          {stripFiltersOpen && (
            <div className={styles.brandStripHeading}>
              <h2 className={styles.brandStripHeadingTitle} id="vehiculos-marca-titulo">
                Marca
              </h2>
            </div>
          )}
          <div
            className={`${styles.brandsCarouselRow} ${
              showBrandScrollArrows ? styles.brandsCarouselRow_hasScroll : ""
            }`}
            role="region"
            aria-labelledby={stripFiltersOpen ? "vehiculos-marca-titulo" : undefined}
            aria-label={stripFiltersOpen ? undefined : "Marcas (filtro del listado)"}
          >
            {showBrandScrollArrows && (
              <button
                type="button"
                className={styles.brandsToolbarArrow}
                aria-label="Ver marcas anteriores"
                disabled={!brandsScroll.canScrollLeft}
                onClick={() => brandsCarouselRef.current?.scrollPrev?.()}
              >
                <BrandStripNudge direction="left" />
              </button>
            )}
            <BrandsCarousel
              ref={brandsCarouselRef}
              selectedBrands={selectedBrands}
              onBrandSelect={handleBrandSelect}
              embedded
              onScrollabilityChange={handleBrandsScrollabilityChange}
            />
            {showBrandScrollArrows && (
              <button
                type="button"
                className={styles.brandsToolbarArrow}
                aria-label="Ver más marcas"
                disabled={!brandsScroll.canScrollRight}
                onClick={() => brandsCarouselRef.current?.scrollNext?.()}
              >
                <BrandStripNudge direction="right" />
              </button>
            )}
          </div>

          <div className={styles.filtersWrapper}>
            <FilterFormSimple
              ref={filterFormRef}
              currentFilters={currentFilters}
              onApplyFilters={handleApplyFilters}
              isLoading={isLoading}
              isError={!!error}
              error={error ? { message: error } : null}
              stripLayout
              onStripFiltersOpenChange={setStripFiltersOpen}
              onRetry={() => {
                setError(null);
                handleApplyFilters(currentFilters);
              }}
            />
          </div>

          <ActionButtons
            onFilterClick={handleFilterClick}
            onSortClick={handleSortClick}
            onSortChange={handleSortChange}
            onCloseSortDropdown={handleCloseSortDropdown}
            selectedSort={selectedSort}
            isSortDisabled={isSortDisabled}
            isSortDropdownOpen={isSortDropdownOpen}
            sortButtonRef={sortButtonRef}
            filtersPanelOpen={stripFiltersOpen}
            className={styles.actionButtons}
            actionButtonClassName={styles.actionButton}
          />
        </div>

        <ActionButtons
          onFilterClick={handleFilterClick}
          onSortClick={handleSortClick}
          onSortChange={handleSortChange}
          onCloseSortDropdown={handleCloseSortDropdown}
          selectedSort={selectedSort}
          isSortDisabled={isSortDisabled}
          isSortDropdownOpen={isSortDropdownOpen}
          sortButtonRef={sortButtonRefDesktop}
          filtersPanelOpen={stripFiltersOpen}
          className={styles.actionButtonsDesktop}
          actionButtonClassName={styles.actionButton}
        />
      </div>

      <div className={`${styles.activeChipsRegion} w-full min-w-0`}>
        <ActiveFilterChips
          chips={activeFilterChips}
          sort={currentSort}
          onRemoveChip={handleRemoveOneFilterChip}
          onClearSort={handleClearSortOnly}
          onClearAllFilters={handleClearFilters}
          showClearAllFilters={isFiltered}
          disabled={isLoading}
        />
      </div>

      <div className={`${styles.container} w-full min-w-0`}>
        <div className={`${styles.vehiclesGrid} w-full min-w-0`}>
          <AutosGrid
            vehicles={sortedVehicles}
            totalVehicles={data?.totalDocs || data?.total || 0}
            isLoading={isLoading}
            hasNextPage={data?.hasNextPage ?? false}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            isError={!!error}
            error={error ? { message: error } : null}
            onRetry={() => {
              setError(null);
              // Refetch
              handleApplyFilters(currentFilters);
            }}
          />
        </div>
      </div>
    </div>
  );
}

