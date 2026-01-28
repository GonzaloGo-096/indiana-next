"use client";

/**
 * UsadosCarousel - Carrusel horizontal de vehículos usados para la página principal
 * 
 * Muestra 8 vehículos en un carrusel horizontal.
 * Diseñado mobile-first para excelente UX en dispositivos móviles.
 * 
 * Características:
 * - Scroll horizontal suave con snap points
 * - Cards usando CardSimilar
 * - Mobile-first responsive design
 * - Skeleton loading states
 * - Manejo de estados vacíos
 * - Flechas unificadas (40px x 40px, fondo negro, posición absoluta)
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { CardSimilar } from "../vehicles/Card/CardSimilar/CardSimilar";
import { ChevronIcon } from "../ui/icons/ChevronIcon";
import styles from "./UsadosCarousel.module.css";

/**
 * Skeleton card para loading state
 */
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonBody}>
      <div className={styles.skeletonContainer1}>
        <div className={styles.skeletonRow1}>
          <div className={styles.skeletonMarca} />
          <div className={styles.skeletonSeparator} />
          <div className={styles.skeletonModelo} />
        </div>
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
      <div className={styles.skeletonPriceContainer}>
        <div className={styles.skeletonPriceLabel} />
        <div className={styles.skeletonPriceValue} />
      </div>
    </div>
  </div>
);

/**
 * Componente principal del carrusel
 */
export const UsadosCarousel = ({ vehicles = [] }) => {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hasUserScrolled = useRef(false); // ✅ Rastrea si el usuario ha interactuado con el scroll
  const isMountedRef = useRef(true);

  // ✅ Función para actualizar el estado de las flechas
  const updateArrowVisibility = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || !isMountedRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    
    // ✅ Flecha izquierda: SOLO si el usuario ha interactuado explícitamente Y hay scroll
    // Desaparece cuando vuelve al inicio (incluyendo padding, umbral de 30px)
    setCanScrollLeft(hasUserScrolled.current && scrollLeft > 30);
    // ✅ Flecha derecha si hay más contenido
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // ✅ Efecto para resetear scroll al inicio cuando cambian los vehículos
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // ✅ Resetear scroll exactamente a 0 y resetear el estado de scroll
    carousel.scrollLeft = 0;
    hasUserScrolled.current = false; // ✅ Resetear el rastreo de scroll
    setCanScrollLeft(false);
    
    // ✅ Múltiples verificaciones para asegurar que el scroll esté en 0
    requestAnimationFrame(() => {
      if (carousel.scrollLeft !== 0) {
        carousel.scrollLeft = 0;
      }
      // Verificar nuevamente después de un frame más
      requestAnimationFrame(() => {
        if (carousel.scrollLeft !== 0) {
          carousel.scrollLeft = 0;
        }
        updateArrowVisibility();
      });
    });
  }, [vehicles, updateArrowVisibility]);

  // ✅ Efecto para detectar scroll y resize
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    isMountedRef.current = true;
    // ✅ Asegurar que el scroll esté en 0 al montar y resetear el rastreo
    carousel.scrollLeft = 0;
    hasUserScrolled.current = false;
    setCanScrollLeft(false);
    
    // ✅ Verificar múltiples veces que el scroll esté en 0
    requestAnimationFrame(() => {
      if (carousel.scrollLeft !== 0) {
        carousel.scrollLeft = 0;
      }
      requestAnimationFrame(() => {
        if (carousel.scrollLeft !== 0) {
          carousel.scrollLeft = 0;
        }
        updateArrowVisibility();
      });
    });

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        // ✅ Solo marcar como scrolleado si el usuario scrolleó manualmente (no por código)
        // Si el scrollLeft es mayor a un umbral razonable, asumimos que fue el usuario
        const { scrollLeft } = carousel;
        if (scrollLeft > 20) {
          hasUserScrolled.current = true;
        }
        updateArrowVisibility();
        rafId = null;
      });
    };

    carousel.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      isMountedRef.current = false;
      carousel.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [updateArrowVisibility]);

  // ✅ Funciones de scroll
  const scrollLeft = useCallback(() => {
    if (carouselRef.current) {
      // ✅ Desplazamiento fijo: 1400px hacia la izquierda
      const currentScroll = carouselRef.current.scrollLeft;
      const newScroll = Math.max(0, currentScroll - 1400);
      carouselRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (carouselRef.current) {
      // ✅ Marcar que el usuario ha scrolleado INMEDIATAMENTE
      hasUserScrolled.current = true;
      
      // ✅ Desplazamiento fijo: 1400px hacia la derecha
      const currentScroll = carouselRef.current.scrollLeft;
      const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
      const newScroll = Math.min(maxScroll, currentScroll + 1400);
      carouselRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
      
      // ✅ Actualizar visibilidad inmediatamente después de marcar
      requestAnimationFrame(() => {
        updateArrowVisibility();
      });
    }
  }, [updateArrowVisibility]);

  // ✅ No mostrar si no hay vehículos
  const shouldShow = useMemo(() => {
    return vehicles && vehicles.length > 0;
  }, [vehicles]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={styles.carouselWrapper}>
      {/* Flecha izquierda - Solo aparece si el usuario ha scrolleado */}
      {canScrollLeft && (
        <button
          className={styles.arrowButton}
          onClick={scrollLeft}
          aria-label="Desplazar hacia la izquierda"
          type="button"
        >
          <ChevronIcon direction="left" size={20} />
        </button>
      )}

      <div ref={carouselRef} className={styles.carouselContainer}>
        {vehicles.length === 0 ? (
          // Empty state
          <div className={styles.emptyState}>
            <p>No hay vehículos disponibles</p>
          </div>
        ) : (
          // Cards de vehículos
          // ✅ LCP: Priorizar primeras 2 imágenes (above the fold)
          vehicles.map((vehicle, index) => (
            <div
              key={vehicle.id || vehicle._id}
              className={styles.cardWrapper}
            >
              <CardSimilar 
                auto={vehicle} 
                isPriority={index < 2}
              />
            </div>
          ))
        )}
      </div>

      {/* Flecha derecha - Siempre visible en desktop, deshabilitada si no hay scroll */}
      <button
        className={`${styles.arrowButton} ${styles.arrowButtonRight} ${!canScrollRight ? styles.arrowButtonDisabled : ''}`}
        onClick={scrollRight}
        aria-label="Desplazar hacia la derecha"
        type="button"
        disabled={!canScrollRight}
      >
        <ChevronIcon direction="right" size={20} />
      </button>
    </div>
  );
};

export default UsadosCarousel;

