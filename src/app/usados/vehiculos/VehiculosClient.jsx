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

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildSearchParams, parseFilters, sortVehicles, hasAnyFilter } from "../../../utils/filters";
import { vehiclesService } from "../../../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../../../lib/mappers/vehicleMapper";
import styles from "./vehiculos.module.css";

import dynamic from "next/dynamic";
import AutosGrid from "../../../components/vehicles/List/ListAutos";
import FilterFormSimple from "../../../components/vehicles/Filters/FilterFormSimple";
import ActionButtons from "../../../components/vehicles/ActionButtons/ActionButtons";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { VEHICLE_CONSTANTS } from "../../../constants/vehicles";

// ✅ Code splitting: BrandsCarousel solo se carga cuando es necesario
const BrandsCarousel = dynamic(
  () => import("../../../components/vehicles/BrandsCarousel"),
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

  // ✅ OPTIMIZADO: Extraer todos los valores de searchParams en un solo useMemo
  // Esto reduce múltiples re-renders y puede ayudar con el error de Suspense
  const searchParamsData = useMemo(() => {
    return {
      filters: parseFilters(searchParams),
      page: Number(searchParams.get("page")) || 1,
      sort: searchParams.get("sort") || null,
    };
  }, [searchParams]);

  const currentFilters = searchParamsData.filters;
  const currentPage = searchParamsData.page;
  const currentSort = searchParamsData.sort;

  // ✅ Restaurar posición de scroll al volver desde detalle
  // ✅ IMPORTANTE: Se ejecuta DESPUÉS de ScrollToTopOnMount
  // Orden: Scroll al top → Skeleton → Contenido → Restaurar scroll (si aplica)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const restoreScroll = () => {
        try {
          const savedData = sessionStorage.getItem("scroll_vehicles-list");
          if (savedData) {
            const scrollData = JSON.parse(savedData);
            // Solo restaurar si es la misma ruta y los datos no son muy antiguos
            const isRecent = scrollData.timestamp && 
              (Date.now() - scrollData.timestamp) < VEHICLE_CONSTANTS.SCROLL_DATA_MAX_AGE;
            if (scrollData.path === "/usados/vehiculos" && isRecent) {
              // ✅ Esperar a que el contenido se renderice completamente
              // Delay mayor para asegurar que el contenido esté listo
              setTimeout(() => {
                window.scrollTo({
                  top: scrollData.position,
                  behavior: "instant", // Sin animación para evitar saltos
                });
                // Limpiar después de restaurar
                sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
              }, Math.max(VEHICLE_CONSTANTS.SCROLL_RESTORE_DELAY, 200)); // Mínimo 200ms
            } else {
              // Limpiar datos antiguos o inválidos
              sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Error al restaurar posición de scroll:", error);
          }
          sessionStorage.removeItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL);
        }
      };

      // ✅ NO restaurar inmediatamente - esperar a que el contenido se cargue
      // El ScrollToTopOnMount ya hizo scroll al top, ahora esperamos a restaurar
      const timeoutId = setTimeout(restoreScroll, VEHICLE_CONSTANTS.SCROLL_RESTORE_TIMEOUT);
      
      return () => clearTimeout(timeoutId);
    }
  }, []); // Solo ejecutar una vez al montar

  // Sincronizar sorting con URL
  useEffect(() => {
    setSelectedSort(currentSort);
  }, [currentSort]);

  // Verificar si hay filtros activos
  const isFiltered = useMemo(() => {
    return hasAnyFilter(currentFilters);
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
        
        // ✅ Restaurar posición de scroll si hay una guardada (desde "Volver a lista principal")
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
    if (filterFormRef.current) {
      filterFormRef.current.toggleFilters();
    }
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

  return (
    <div className={styles.page}>
      {/* Título */}
      <div className={styles.titleContainer}>
        <div className={styles.titleSection}>
          <h1 className={styles.mainTitle}>Nuestros Usados</h1>
        </div>
      </div>

      {/* Sección del carrusel y filtros */}
      <div className={styles.carouselSection}>
        {/* ✅ BrandsCarousel usa dynamic() que ya maneja loading, no necesita Suspense adicional */}
        <BrandsCarousel
          selectedBrands={selectedBrands}
          onBrandSelect={handleBrandSelect}
        />

        {/* FilterFormSimple */}
        <div className={styles.filtersWrapper}>
          <FilterFormSimple
            ref={filterFormRef}
            currentFilters={currentFilters} // ✅ FIX SUSPENSE: Pasar filtros como prop (elimina useSearchParams del hijo)
            onApplyFilters={handleApplyFilters}
            isLoading={isLoading}
            isError={!!error}
            error={error ? { message: error } : null}
            onRetry={() => {
              setError(null);
              handleApplyFilters(currentFilters);
            }}
          />
        </div>

        {/* Botones de acción - dentro del carrusel */}
        <ActionButtons
          onFilterClick={handleFilterClick}
          onSortClick={handleSortClick}
          onSortChange={handleSortChange}
          onCloseSortDropdown={handleCloseSortDropdown}
          selectedSort={selectedSort}
          isSortDisabled={isSortDisabled}
          isSortDropdownOpen={isSortDropdownOpen}
          sortButtonRef={sortButtonRef}
          className={styles.actionButtons}
        />
      </div>

      <div className={styles.container}>
        {/* Grid de vehículos */}
        <div className={styles.vehiclesGrid}>
          <AutosGrid
            vehicles={sortedVehicles}
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

        {/* Botón para volver a lista principal */}
        {isFiltered && (
          <div className={styles.backButtonContainer}>
            <button
              className={styles.backButton}
              onClick={handleClearFilters}
            >
              Volver a lista principal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

