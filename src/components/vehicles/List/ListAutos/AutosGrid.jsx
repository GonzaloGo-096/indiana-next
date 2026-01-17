"use client";

/**
 * AutosGrid - Componente para mostrar el grid de vehículos optimizado
 * 
 * Responsabilidades:
 * - Renderizado del grid de autos
 * - Estados de carga y error del grid
 * - Paginación infinita con scroll automático optimizado
 * - Performance optimizada
 * 
 * @author Indiana Peugeot
 * @version 4.6.0 - Migración desde React
 */

import { memo, useMemo, useCallback } from "react";
import { CardAuto } from "../../Card/CardAuto";
import styles from "./ListAutos.module.css";

/**
 * Componente de error reutilizable
 */
const ErrorMessage = memo(({ message, onRetry }) => (
  <div className={styles.error}>
    <div className={styles.errorContent}>
      <h3>¡Ups! Algo salió mal</h3>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={styles.retryButton}>
          Reintentar
        </button>
      )}
    </div>
  </div>
));

ErrorMessage.displayName = "ErrorMessage";

/**
 * Skeleton loader simple
 */
const ListAutosSkeleton = memo(() => (
  <div className={styles.loadingContainer}>
    <div className={styles.loading}>
      {[...Array(8)].map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonText} style={{ width: "60%" }} />
            <div className={styles.skeletonText} style={{ width: "80%" }} />
            <div className={styles.skeletonText} style={{ width: "50%" }} />
          </div>
        </div>
      ))}
    </div>
  </div>
));

ListAutosSkeleton.displayName = "ListAutosSkeleton";

/**
 * Componente de tarjeta individual optimizado
 */
const MemoizedCardAuto = memo(({ vehicle, priority = "auto" }) => (
  <div className={styles.cardWrapper}>
    <CardAuto auto={vehicle} imagePriority={priority} />
  </div>
));

MemoizedCardAuto.displayName = "MemoizedCardAuto";

const AutosGrid = memo(
  ({
    vehicles,
    isLoading,
    isError,
    error,
    onRetry,
    hasNextPage = false,
    isLoadingMore = false,
    onLoadMore = null,
  }) => {
    // ✅ Callback memoizado para loadMore
    const handleLoadMore = useCallback(() => {
      if (hasNextPage && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    }, [hasNextPage, isLoadingMore, onLoadMore]);

    // ✅ OPTIMIZADO: Memoizar el grid de vehículos con keys estables
    const vehiclesGrid = useMemo(() => {
      if (!vehicles || vehicles.length === 0) {
        return null;
      }

      // ✅ Crear Set de IDs vistos para detectar duplicados
      const seenIds = new Set();
      
      return vehicles.map((vehicle, index) => {
        // ✅ Key estable basada en ID único
        // Si no hay ID o está duplicado, usar índice como fallback
        let stableKey;
        if (vehicle.id) {
          if (seenIds.has(vehicle.id)) {
            // ID duplicado: usar índice como fallback
            stableKey = `vehicle-${vehicle.id}-index-${index}`;
          } else {
            seenIds.add(vehicle.id);
            stableKey = `vehicle-${vehicle.id}`;
          }
        } else {
          stableKey = `vehicle-index-${index}`;
        }

        // ✅ OPTIMIZADO: Solo primeras 6 imágenes del total acumulado tienen alta prioridad (LCP)
        // Esto funciona correctamente porque vehicles ya contiene todos los vehículos acumulados
        return (
          <MemoizedCardAuto
            key={stableKey}
            vehicle={vehicle}
            priority={index < 6 ? "high" : "auto"}
          />
        );
      });
    }, [vehicles]);

    // Estado de carga inicial
    if (isLoading && (!vehicles || vehicles.length === 0)) {
      return <ListAutosSkeleton />;
    }

    // Estado de error
    if (isError) {
      return (
        <ErrorMessage
          message={error?.message || "Error al cargar los vehículos"}
          onRetry={onRetry}
        />
      );
    }

    // Sin vehículos
    if (!vehicles || vehicles.length === 0) {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <h3>No se encontraron vehículos</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.gridContainer}>
        {/* Grid de vehículos */}
        <div className={styles.grid}>{vehiclesGrid}</div>

        {/* ✅ BOTÓN "CARGAR MÁS" */}
        {hasNextPage && (
          <div className={styles.loadMoreSection}>
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLoadMore();
              }}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Cargando..." : "Cargar más vehículos"}
            </button>
          </div>
        )}
      </div>
    );
  }
);

AutosGrid.displayName = "AutosGrid";

export default AutosGrid;

