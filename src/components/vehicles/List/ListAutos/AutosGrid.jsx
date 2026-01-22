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
 * Skeleton loader profesional - Estructura igual a CardAuto
 * ✅ Mejorado: Accesibilidad y animación estandarizada
 */
const ListAutosSkeleton = memo(() => (
  <div 
    className={styles.loadingContainer}
    role="status"
    aria-label="Cargando vehículos..."
    aria-live="polite"
  >
    <div className={styles.loading}>
      {[...Array(8)].map((_, index) => (
        <div 
          key={index} 
          className={styles.skeletonCard}
          aria-hidden="true"
        >
          {/* Imagen principal - aspect-ratio 16/9 igual a CardAuto */}
          <div className={styles.skeletonImage} />
          
          {/* Body con estructura igual a CardAuto */}
          <div className={styles.skeletonBody}>
            {/* Container1: Logo + Datos */}
            <div className={styles.skeletonContainer1}>
              {/* Logo de marca (posición absoluta) */}
              <div className={styles.skeletonLogo} />
              
              {/* Bloque de datos con padding para logo */}
              <div className={styles.skeletonContainer1Right}>
                {/* Fila 1: Marca | Modelo */}
                <div className={styles.skeletonRow1}>
                  <div className={styles.skeletonMarca} />
                  <div className={styles.skeletonSeparator} />
                  <div className={styles.skeletonModelo} />
                </div>
                
                {/* Fila 3: Caja, Km, Año (3 columnas) */}
                <div className={styles.skeletonRow3}>
                  <div className={styles.skeletonDataItem}>
                    <div className={styles.skeletonDataLabel} />
                    <div className={styles.skeletonDataValue} />
                  </div>
                  <div className={styles.skeletonDataItem}>
                    <div className={styles.skeletonDataLabel} />
                    <div className={styles.skeletonDataValue} />
                  </div>
                  <div className={styles.skeletonDataItem}>
                    <div className={styles.skeletonDataLabel} />
                    <div className={styles.skeletonDataValue} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Container4: Precio con "desde:" */}
            <div className={styles.skeletonPriceContainer}>
              <div className={styles.skeletonPriceLabel} />
              <div className={styles.skeletonPriceValue} />
            </div>
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

