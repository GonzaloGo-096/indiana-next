"use client";

/**
 * VehiculosClient - Client Component para interactividad
 *
 * Responsabilidades:
 * - Renderizado de UI (filtros, grid, paginación, carrusel de marcas)
 * - Estado visual (dropdown sort, panel filtros, scroll de marcas)
 *
 * La lógica de datos, URL, fetch, analytics y sessionStorage vive
 * en useVehiclesList().
 */

import { useState, useCallback, useMemo, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import cta from "@/components/home/HomeSectionCtas.module.css";
import styles from "./vehiculos.module.css";

import dynamic from "next/dynamic";
import AutosGrid from "../../../../components/vehicles/List/ListAutos";
import FilterFormSimple from "../../../../components/vehicles/Filters/FilterFormSimple";
import ActiveFilterChips from "../../../../components/vehicles/Filters/ActiveFilterChips";
import ActionButtons from "../../../../components/vehicles/ActionButtons/ActionButtons";
import ItemListViewTracker from "@/components/analytics/ItemListViewTracker";
import { SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";

import { useVehiclesList } from "./useVehiclesList";

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

const BrandsCarousel = dynamic(
  () => import("../../../../components/vehicles/BrandsCarousel"),
  {
    loading: () => <div style={{ minHeight: "80px" }} />,
    ssr: false,
  }
);

/**
 * @param {Object} props
 * @param {Object} props.initialData - Datos iniciales del Server Component
 * @param {Object} props.initialFilters - Filtros iniciales (unused, kept for API compat)
 * @param {number} props.initialPage - Página inicial (unused, kept for API compat)
 * @param {string} props.error - Error inicial (opcional)
 */
export default function VehiculosClient({
  initialData,
  initialFilters = {},
  initialPage = 1,
  error: initialError = null,
}) {
  // --- Data hook (URL, fetch, sort, filters, analytics) ----------------------
  const {
    data,
    sortedVehicles,
    isLoading,
    isLoadingMore,
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
    trackingItems,
    listSignature,
  } = useVehiclesList({ initialData, initialError });

  // --- UI state (visual only) ------------------------------------------------
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [stripFiltersOpen, setStripFiltersOpen] = useState(false);
  const [brandsScroll, setBrandsScroll] = useState({
    canScrollLeft: false,
    canScrollRight: true,
  });

  const filterFormRef = useRef(null);
  const sortButtonRef = useRef(null);
  const sortButtonRefDesktop = useRef(null);
  const brandsCarouselRef = useRef(null);
  const brandsCarouselScrollRestoreRef = useRef(null);

  // --- UI handlers -----------------------------------------------------------

  const handleBrandsScrollabilityChange = useCallback((next) => {
    setBrandsScroll(next);
  }, []);

  useLayoutEffect(() => {
    if (!stripFiltersOpen) return;
    const track = brandsCarouselRef.current?.getTrackElement?.();
    const saved = brandsCarouselScrollRestoreRef.current;
    brandsCarouselScrollRestoreRef.current = null;
    if (!track || saved == null) return;
    track.scrollLeft = saved;
  }, [stripFiltersOpen]);

  const handleSortChange = useCallback(
    (newSort) => {
      setIsSortDropdownOpen(false);
      changeSort(newSort);
    },
    [changeSort],
  );

  const handleClearSortOnly = useCallback(() => {
    handleSortChange(null);
  }, [handleSortChange]);

  // Aplicar filtros desde el formulario "Aplicar" → agrega al historial del browser
  // (el usuario puede deshacer con back). Otros callers (carrusel, chips) usan replace.
  const handleApplyFiltersFromForm = useCallback(
    (newFilters) => {
      applyFilters(newFilters, { addToHistory: true });
    },
    [applyFilters],
  );

  const handleRemoveOneFilterChip = useCallback(
    (nextFilters) => {
      applyFilters(nextFilters);
    },
    [applyFilters],
  );

  const handleFilterClick = useCallback(() => {
    const track = brandsCarouselRef.current?.getTrackElement?.();
    brandsCarouselScrollRestoreRef.current =
      track != null ? track.scrollLeft : null;
    filterFormRef.current?.toggleFilters();
  }, []);

  const handleSortClick = useCallback(() => {
    setIsSortDropdownOpen((prev) => !prev);
  }, []);

  const handleCloseSortDropdown = useCallback(() => {
    setIsSortDropdownOpen(false);
  }, []);

  // --- Derived UI values -----------------------------------------------------

  const isSortDisabled = isLoading || (data.vehicles || []).length === 0;

  const showBrandScrollArrows = useMemo(
    () => brandsScroll.canScrollLeft || brandsScroll.canScrollRight,
    [brandsScroll.canScrollLeft, brandsScroll.canScrollRight],
  );

  // --- Render ----------------------------------------------------------------

  return (
    <div className={`${styles.page} w-full min-w-0 antialiased`}>
      <ItemListViewTracker
        items={trackingItems}
        itemListName={ITEM_LIST.USADOS_GRID}
        location={LOCATIONS.USADOS_LIST}
        source={SOURCES.LISTING_PAGE}
        signature={listSignature}
      />
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
              <h2
                className={styles.brandStripHeadingTitle}
                id="vehiculos-marca-titulo"
              >
                Marca
              </h2>
            </div>
          )}
          <div
            className={`${styles.brandsCarouselRow} ${
              showBrandScrollArrows ? styles.brandsCarouselRow_hasScroll : ""
            }`}
            role="region"
            aria-labelledby={
              stripFiltersOpen ? "vehiculos-marca-titulo" : undefined
            }
            aria-label={
              stripFiltersOpen ? undefined : "Marcas (filtro del listado)"
            }
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
              onBrandSelect={selectBrand}
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
              onApplyFilters={handleApplyFiltersFromForm}
              isLoading={isLoading}
              isError={!!error}
              error={error ? { message: error } : null}
              stripLayout
              onStripFiltersOpenChange={setStripFiltersOpen}
              onRetry={() => {
                setError(null);
                applyFilters(currentFilters);
              }}
            />
          </div>

          <ActionButtons
            onFilterClick={handleFilterClick}
            onSortClick={handleSortClick}
            onSortChange={handleSortChange}
            onCloseSortDropdown={handleCloseSortDropdown}
            selectedSort={currentSort}
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
          selectedSort={currentSort}
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
          onClearAllFilters={clearFilters}
          showClearAllFilters={isFiltered}
          disabled={isLoading}
        />
      </div>

      <div className={`${styles.container} w-full min-w-0`}>
        <div className={`${styles.vehiclesGrid} w-full min-w-0`}>
          <AutosGrid
            vehicles={sortedVehicles}
            totalVehicles={data?.total || 0}
            isLoading={isLoading}
            hasNextPage={data?.hasNextPage ?? false}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            isError={!!error}
            error={error ? { message: error } : null}
            onRetry={() => {
              setError(null);
              applyFilters(currentFilters);
            }}
          />
        </div>
      </div>
    </div>
  );
}
