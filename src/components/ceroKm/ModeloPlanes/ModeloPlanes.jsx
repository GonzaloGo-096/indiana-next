"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { getPlanesPorModelo } from "../../../data/planes";
import { getModelo } from "../../../data/modelos";
import { PlanCard } from "../../planes/PlanCard";
import { CarouselDots } from "../../ui/CarouselDots/CarouselDots";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import { PeugeotIcon } from "../../ui/icons/PeugeotIcon";
import { getClosestChildIndex, scrollToChildIndex } from "../../../utils/carouselActiveIndex";
import styles from "./ModeloPlanes.module.css";

/**
 * ModeloPlanes - Componente genérico para mostrar planes de financiación de un modelo
 * 
 * Reemplaza ScrollParallaxTransition208 y ScrollParallaxTransition2008
 * Funciona para cualquier modelo que tenga planes: 208, 2008, partner, expert
 * 
 * @param {Object} props
 * @param {string} props.modeloSlug - Slug del modelo (ej: '208', '2008', 'partner', 'expert')
 */
const ModeloPlanes = ({ modeloSlug }) => {
  const modelo = getModelo(modeloSlug);

  // Obtener planes para este modelo (siempre array; sin modelo válido → [])
  const planes = useMemo(() => {
    const m = getModelo(modeloSlug);
    if (!m) return [];
    const p = getPlanesPorModelo(modeloSlug);
    return Array.isArray(p) ? p : [];
  }, [modeloSlug]);

  const scrollContainerRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar si se puede scrollear
  const checkScrollability = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px de tolerancia
  }, []);

  // Indicador por ÍTEM (no por página)
  const itemCount = planes.length;
  // Flechas solo en desktop cuando hay 4 o más cards
  const showArrows = itemCount >= 4;
  const [activeItem, setActiveItem] = useState(0);
  const checkActiveItem = useCallback(() => {
    if (!scrollContainerRef.current) return;
    setActiveItem(getClosestChildIndex(scrollContainerRef.current));
  }, []);

  React.useEffect(() => {
    checkScrollability();
    checkActiveItem();
    const container = scrollContainerRef.current;
    if (container) {
      // ✅ OPTIMIZADO: requestAnimationFrame para scroll
      let rafId = null;
      const onScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          checkScrollability();
          checkActiveItem();
          rafId = null;
        });
      };

      // ✅ OPTIMIZADO: Debounce para resize
      let resizeTimeout = null;
      const onResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          checkScrollability();
          checkActiveItem();
        }, 150);
      };

      container.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      return () => {
        container.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        if (rafId) cancelAnimationFrame(rafId);
        if (resizeTimeout) clearTimeout(resizeTimeout);
      };
    }
  }, [planes, checkScrollability, checkActiveItem]);

  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  }, []);

  // Memoizar la lista de planes para evitar re-renders innecesarios
  const planesCards = useMemo(
    () =>
      planes.map((plan) => (
        <PlanCard key={plan.id} plan={plan} modelo={modeloSlug} />
      )),
    [planes, modeloSlug]
  );

  // Callback memoizado para el click en dots del carrusel
  const handleDotClick = useCallback(
    (i) => {
      if (!scrollContainerRef.current) return;
      scrollToChildIndex(scrollContainerRef.current, i);
    },
    []
  );

  const rawNombre = modelo?.nombre;
  const modeloDisplay =
    typeof rawNombre === "string" && rawNombre.length > 0
      ? rawNombre.charAt(0).toUpperCase() + rawNombre.slice(1)
      : "";

  // Validación (después de todos los hooks)
  if (!modelo || planes.length === 0) {
    return null;
  }

  return (
    <section className={styles.modeloPlanes}>
      <div className={styles.planesContent}>
      <div className={styles.modeloTitleContainer}>
        <h2 className={styles.modeloTitle}>
          <PeugeotIcon className={styles.modeloTitleIcon} size={48} color="#000000" />
          Planes {modeloDisplay}
        </h2>
        <Link href="/planes" className={styles.verTodosButton}>
          Ver todos
        </Link>
      </div>

      {/* Carrusel de cards */}
      <div className={styles.carouselContainer}>
        {/* Flecha izquierda - solo desktop, 4+ cards */}
        {showArrows && canScrollLeft && (
          <button
            className={styles.arrowButton}
            onClick={scrollLeft}
            aria-label="Anterior"
          >
            <ChevronIcon direction="left" />
          </button>
        )}

        {/* Contenedor de cards con scroll */}
        <div ref={scrollContainerRef} className={styles.carouselTrack}>
          {/* Cards de planes - Memoizado para mejor performance */}
          {planesCards}
        </div>

        {/* Flecha derecha - solo desktop, 4+ cards */}
        {showArrows && canScrollRight && (
          <button
            className={`${styles.arrowButton} ${styles.arrowRight}`}
            onClick={scrollRight}
            aria-label="Siguiente"
          >
            <ChevronIcon direction="right" />
          </button>
        )}
      </div>

      {/* Indicador de páginas del carrusel */}
      <div className={styles.carouselDots}>
        <CarouselDots
          count={itemCount}
          activeIndex={activeItem}
          variant="autocity"
          onDotClick={handleDotClick}
        />
      </div>
      </div>
    </section>
  );
};

export default ModeloPlanes;
