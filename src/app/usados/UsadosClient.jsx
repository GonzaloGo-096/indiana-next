"use client";

/**
 * UsadosClient - Client Component para interactividad
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
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildSearchParams, parseFilters, sortVehicles } from "../../utils/filters";
import { vehiclesService } from "../../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../../lib/mappers/vehicleMapper";
import UsadosGrid from "./UsadosGrid";
import UsadosFilters from "./UsadosFilters";
import styles from "./usados.module.css";

/**
 * @param {Object} props
 * @param {Object} props.initialData - Datos iniciales del Server Component
 * @param {Object} props.initialFilters - Filtros iniciales
 * @param {number} props.initialPage - Página inicial
 * @param {string} props.error - Error inicial (opcional)
 */
export default function UsadosClient({
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
  const [error, setError] = useState(initialError);

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

  // Vehículos ordenados (si hay sorting)
  const sortedVehicles = useMemo(() => {
    if (!currentSort) return data.vehicles;
    return sortVehicles(data.vehicles, currentSort);
  }, [data.vehicles, currentSort]);

  /**
   * Actualizar URL con nuevos filtros/página
   * 
   * @param {Object} newFilters - Nuevos filtros
   * @param {number} newPage - Nueva página (opcional)
   * @param {string} newSort - Nuevo sorting (opcional)
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
      const newURL = `/usados${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newURL);
    },
    [router, currentSort]
  );

  /**
   * Aplicar filtros (actualiza URL y hace fetch)
   */
  const handleApplyFilters = useCallback(
    async (newFilters) => {
      setIsLoading(true);
      setError(null);

      // Actualizar URL (esto causará re-render del Server Component)
      updateURL(newFilters, 1, currentSort);

      // Fetch adicional desde cliente (opcional, Server Component ya hizo fetch)
      // En producción, podemos confiar solo en el Server Component
      try {
        const backendData = await vehiclesService.getVehicles({
          filters: newFilters,
          limit: 12,
          cursor: 1,
        });
        const mappedData = mapVehiclesPage(backendData, 1);
        setData(mappedData);
      } catch (err) {
        console.error("[UsadosClient] Error fetching vehicles:", err);
        setError(err.message || "Error al cargar vehículos");
      } finally {
        setIsLoading(false);
      }
    },
    [updateURL, currentSort]
  );

  /**
   * Cambiar página
   */
  const handlePageChange = useCallback(
    async (newPage) => {
      setIsLoading(true);
      setError(null);

      // Actualizar URL
      updateURL(currentFilters, newPage, currentSort);

      // Fetch adicional desde cliente
      try {
        const backendData = await vehiclesService.getVehicles({
          filters: currentFilters,
          limit: 12,
          cursor: newPage,
        });
        const mappedData = mapVehiclesPage(backendData, newPage);
        setData(mappedData);
      } catch (err) {
        console.error("[UsadosClient] Error fetching vehicles:", err);
        setError(err.message || "Error al cargar vehículos");
      } finally {
        setIsLoading(false);
      }
    },
    [currentFilters, updateURL, currentSort]
  );

  /**
   * Cambiar sorting
   */
  const handleSortChange = useCallback(
    (newSort) => {
      // Solo actualizar URL (sorting es local, no requiere fetch)
      updateURL(currentFilters, currentPage, newSort);
    },
    [currentFilters, currentPage, updateURL]
  );

  /**
   * Limpiar filtros
   */
  const handleClearFilters = useCallback(() => {
    updateURL({}, 1, null);
  }, [updateURL]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Vehículos Usados Multimarca</h1>
          <p className={styles.subtitle}>
            Amplia selección de vehículos usados con garantía, financiación
            disponible y servicio postventa profesional.
          </p>
        </div>
      </header>

      {/* Sección de Promociones */}
      <section className={styles.promocionesSection}>
        <div className="container">
          <h2 className={styles.promocionesTitle}>Promociones y Formas de Pago</h2>
          <div className={styles.promocionesGrid}>
            <div className={styles.promocionCard}>
              <h3 className={styles.cardTitle}>Financiación</h3>
              <p className={styles.cardText}>
                Financiación disponible con cuotas fijas en pesos. Consultá las
                mejores opciones para tu vehículo.
              </p>
            </div>
            <div className={styles.promocionCard}>
              <h3 className={styles.cardTitle}>Garantía Incluida</h3>
              <p className={styles.cardText}>
                Todos nuestros vehículos usados incluyen garantía. Tranquilidad
                y confianza en tu compra.
              </p>
            </div>
            <div className={styles.promocionCard}>
              <h3 className={styles.cardTitle}>Formas de Pago</h3>
              <p className={styles.cardText}>
                Efectivo, transferencia, cheque o financiación. Adaptamos el
                pago a tus necesidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros y Grid */}
      <section className={styles.contentSection}>
        <div className="container">
          <UsadosFilters
            initialFilters={currentFilters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            isLoading={isLoading}
          />

          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorContent}>
                <h3 className={styles.errorTitle}>Error al cargar vehículos</h3>
                <p className={styles.errorText}>{error}</p>
                <button
                  onClick={() => handleApplyFilters(currentFilters)}
                  className={styles.errorButton}
                >
                  🔄 Reintentar
                </button>
              </div>
            </div>
          )}

          <UsadosGrid
            vehicles={sortedVehicles}
            total={data.totalDocs}
            currentPage={currentPage}
            hasNextPage={data.hasNextPage}
            onPageChange={handlePageChange}
            isLoading={isLoading}
            sort={currentSort}
            onSortChange={handleSortChange}
          />
        </div>
      </section>
    </div>
  );
}

