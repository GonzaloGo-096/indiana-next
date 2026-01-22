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
import Image from "next/image";
import { CardSimilar } from "../Card/CardSimilar/CardSimilar";
import { useSimilarVehicles } from "../../../hooks/useSimilarVehicles";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import { getBrandLogo } from "../../../utils/getBrandLogo";
import styles from "./SimilarVehiclesCarousel.module.css";

/**
 * Skeleton card para loading state - Estructura profesional igual a CardSimilar
 */
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    {/* Imagen principal - igual altura que CardSimilar (180px desktop) */}
    <div className={styles.skeletonImage} />
    
    {/* Body con estructura igual a CardSimilar */}
    <div className={styles.skeletonBody}>
      {/* Container1: Marca + Modelo */}
      <div className={styles.skeletonContainer1}>
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
      
      {/* Container4: Precio con "desde:" */}
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
export const SimilarVehiclesCarousel = ({ currentVehicle }) => {
  const { vehicles, isLoading, isError } = useSimilarVehicles(currentVehicle);
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
      // ✅ Desplazamiento fijo: 1400px hacia la izquierda (igual que UsadosCarousel)
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
      
      // ✅ Desplazamiento fijo: 1400px hacia la derecha (igual que UsadosCarousel)
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

  // ✅ No mostrar si no hay vehículos similares
  const shouldShow = useMemo(() => {
    if (isLoading) return true; // Mostrar skeleton mientras carga
    return vehicles && vehicles.length > 0;
  }, [vehicles, isLoading]);

  // ✅ Obtener logo de la marca
  const brandLogo = useMemo(() => {
    if (!currentVehicle?.marca) return null;
    return getBrandLogo(currentVehicle.marca);
  }, [currentVehicle?.marca]);

  if (!shouldShow && !isLoading) {
    return null;
  }

  return (
    <section className={styles.section} data-testid="similar-vehicles-carousel">
      <div className={styles.container}>
        {/* Título de la sección con logo */}
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>
              Más vehículos {currentVehicle?.marca || ""}
            </h2>
            {brandLogo && (
              <div className={styles.brandLogoWrapper}>
                <Image
                  src={brandLogo.src}
                  alt={brandLogo.alt}
                  width={60}
                  height={60}
                  className={styles.brandLogo}
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>

        {/* Carrusel horizontal */}
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
      </div>
    </section>
  );
};

export default SimilarVehiclesCarousel;


