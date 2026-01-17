"use client";

/**
 * SimilarVehiclesCarousel - Carrusel horizontal de vehículos similares
 * 
 * Muestra vehículos de la misma marca en un carrusel horizontal.
 * Diseñado mobile-first para excelente UX en dispositivos móviles.
 * 
 * Características:
 * - Scroll horizontal suave con snap points
 * - Cards más pequeñas adaptadas del diseño existente
 * - Mobile-first responsive design
 * - Skeleton loading states
 * - Manejo de estados vacíos
 * - Flechas unificadas (40px x 40px, fondo negro, posición absoluta)
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Next.js migrado
 */

import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { CardSimilar } from "../Card/CardSimilar/CardSimilar";
import { useSimilarVehicles } from "../../../hooks/useSimilarVehicles";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import styles from "./SimilarVehiclesCarousel.module.css";

/**
 * Skeleton card para loading state
 */
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonText} style={{ width: "60%" }} />
      <div className={styles.skeletonText} style={{ width: "80%" }} />
      <div className={styles.skeletonText} style={{ width: "50%" }} />
    </div>
  </div>
);

/**
 * Componente principal del carrusel
 */
export const SimilarVehiclesCarousel = ({ currentVehicle }) => {
  const { vehicles, isLoading, isError } = useSimilarVehicles(currentVehicle);
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isMountedRef = useRef(true);

  // ✅ Función para actualizar el estado de las flechas
  const updateArrowVisibility = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || !isMountedRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  // ✅ Efecto para detectar scroll y resize
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    isMountedRef.current = true;
    updateArrowVisibility();

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        updateArrowVisibility();
        rafId = null;
      });
    };

    carousel.addEventListener("scroll", onScroll);
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
      const cardWidth =
        carouselRef.current.querySelector(`.${styles.cardWrapper}`)?.offsetWidth ||
        320;
      // Calcular gap desde el estilo computado
      const computedStyle = window.getComputedStyle(carouselRef.current);
      const gap = parseFloat(computedStyle.gap) || 24;
      carouselRef.current.scrollBy({
        left: -(cardWidth + gap),
        behavior: "smooth",
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (carouselRef.current) {
      const cardWidth =
        carouselRef.current.querySelector(`.${styles.cardWrapper}`)?.offsetWidth ||
        320;
      // Calcular gap desde el estilo computado
      const computedStyle = window.getComputedStyle(carouselRef.current);
      const gap = parseFloat(computedStyle.gap) || 24;
      carouselRef.current.scrollBy({
        left: cardWidth + gap,
        behavior: "smooth",
      });
    }
  }, []);

  // ✅ No mostrar si no hay vehículos similares
  const shouldShow = useMemo(() => {
    if (isLoading) return true; // Mostrar skeleton mientras carga
    return vehicles && vehicles.length > 0;
  }, [vehicles, isLoading]);

  if (!shouldShow && !isLoading) {
    return null;
  }

  return (
    <section className={styles.section} data-testid="similar-vehicles-carousel">
      <div className={styles.container}>
        {/* Título de la sección */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Más vehículos {currentVehicle?.marca || ""}
          </h2>
        </div>

        {/* Carrusel horizontal */}
        <div className={styles.carouselWrapper}>
          {/* Flecha izquierda - Solo desktop y solo si se puede desplazar a la izquierda */}
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
            {isLoading ? (
              // Skeleton loading
              <>
                {[...Array(3)].map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} />
                ))}
              </>
            ) : isError ? (
              // Error state
              <div className={styles.errorState}>
                <p>No se pudieron cargar los vehículos similares</p>
              </div>
            ) : (
              // Cards de vehículos
              vehicles.map((vehicle) => (
                <div
                  key={vehicle.id || vehicle._id}
                  className={styles.cardWrapper}
                >
                  <CardSimilar auto={vehicle} />
                </div>
              ))
            )}
          </div>

          {/* Flecha derecha - Solo desktop y solo si se puede desplazar a la derecha */}
          {canScrollRight && (
            <button
              className={`${styles.arrowButton} ${styles.arrowButtonRight}`}
              onClick={scrollRight}
              aria-label="Desplazar hacia la derecha"
              type="button"
            >
              <ChevronIcon direction="right" size={20} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SimilarVehiclesCarousel;

