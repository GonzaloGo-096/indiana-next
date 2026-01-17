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

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildSearchParams, parseFilters, sortVehicles, hasAnyFilter } from "../../../utils/filters";
import { vehiclesService } from "../../../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../../../lib/mappers/vehicleMapper";
import styles from "./vehiculos.module.css";

import dynamic from "next/dynamic";
import AutosGrid from "../../../components/vehicles/List/ListAutos";
import FilterFormSimple from "../../../components/vehicles/Filters/FilterFormSimple";
import SortDropdown from "../../../components/vehicles/Filters/SortDropdown";

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

  // Filtros actuales desde URL (única fuente de verdad)
  const currentFilters = useMemo(() => {
    return parseFilters(searchParams);
  }, [searchParams]);

  // Página actual desde URL
  const currentPage = useMemo(() => {
    return Number(searchParams.get("page")) || 1;
  }, [searchParams]);

  // Sorting desde URL (opcional)
  const currentSort = useMemo(() => {
    return searchParams.get("sort") || null;
  }, [searchParams]);

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
          limit: 8,
          cursor: 1,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        // ✅ REEMPLAZAR vehículos (nuevos filtros)
        setData(mappedData);
        
        // ✅ Restaurar posición de scroll si hay una guardada (desde "Volver a lista principal")
        const savedPosition = sessionStorage.getItem('vehiculos_scroll_position');
        if (savedPosition) {
          // ✅ Usar doble requestAnimationFrame para mejor sincronización con el DOM
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: Number(savedPosition),
                behavior: 'smooth'
              });
              // Limpiar después de restaurar
              sessionStorage.removeItem('vehiculos_scroll_position');
            });
          });
        }
      } catch (err) {
        console.error("[VehiculosClient] Error fetching vehicles:", err);
        // ✅ Limpiar sessionStorage en caso de error
        sessionStorage.removeItem('vehiculos_scroll_position');
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
          limit: 8,
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
        console.error("[VehiculosClient] Error fetching more vehicles:", err);
        // ✅ Limpiar sessionStorage en caso de error
        sessionStorage.removeItem('vehiculos_scroll_position');
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
    sessionStorage.setItem('vehiculos_scroll_position', String(scrollPosition));
    
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
        <Suspense fallback={<div style={{ minHeight: "80px" }} />}>
          <BrandsCarousel
            selectedBrands={selectedBrands}
            onBrandSelect={handleBrandSelect}
          />
        </Suspense>

        {/* FilterFormSimple */}
        <div className={styles.filtersWrapper}>
          <FilterFormSimple
            ref={filterFormRef}
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

        {/* Botones de acción - Mobile: dentro del carrusel */}
        <div className={styles.actionButtons}>
          <button
            className={styles.actionButton}
            onClick={handleFilterClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
            </svg>
            Filtrar
          </button>

          <div style={{ position: "relative" }}>
            <button
              ref={sortButtonRef}
              className={`${styles.actionButton} ${selectedSort ? styles.active : ""}`}
              onClick={handleSortClick}
              disabled={isSortDisabled}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"></path>
                <path d="M6 12h12"></path>
                <path d="M9 18h6"></path>
              </svg>
              Ordenar
            </button>

            {/* SortDropdown */}
            {isSortDropdownOpen && (
              <SortDropdown
                isOpen={isSortDropdownOpen}
                selectedSort={selectedSort}
                onSortChange={handleSortChange}
                onClose={handleCloseSortDropdown}
                disabled={isSortDisabled}
                triggerRef={sortButtonRef}
              />
            )}
          </div>
        </div>
      </div>

      {/* Botones de acción - Desktop: fuera del carrusel */}
      <div className={styles.actionButtonsDesktop}>
        <button
          className={styles.actionButton}
          onClick={handleFilterClick}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
          </svg>
          Filtrar
        </button>

        <div style={{ position: "relative" }}>
          <button
            ref={sortButtonRef}
            className={`${styles.actionButton} ${selectedSort ? styles.active : ""}`}
            onClick={handleSortClick}
            disabled={isSortDisabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"></path>
              <path d="M6 12h12"></path>
              <path d="M9 18h6"></path>
            </svg>
            Ordenar
          </button>

          {/* SortDropdown */}
          {isSortDropdownOpen && (
            <SortDropdown
              isOpen={isSortDropdownOpen}
              selectedSort={selectedSort}
              onSortChange={handleSortChange}
              onClose={handleCloseSortDropdown}
              disabled={isSortDisabled}
              triggerRef={sortButtonRef}
            />
          )}
        </div>
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

