"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { getPlanesPorModelo } from "@/data/planes";
import { getModelo } from "@/data/modelos";
import { PlanCard } from "@/components/planes/PlanCard";
import { CarouselDots } from "@/components/ui/CarouselDots/CarouselDots";
import { PeugeotIcon } from "@/components/ui/icons/PeugeotIcon";
import { getClosestChildIndex, scrollToChildIndex } from "@/utils/carouselActiveIndex";
import cta from "@/components/home/HomeSectionCtas.module.css";
import kmStyles from "@/app/(site)/0km/0km.module.css";
import styles from "./ModeloPlanes.module.css";

/**
 * ModeloPlanes - Componente genérico para mostrar planes de financiación de un modelo
 *
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

  // Indicador por ítem (cada plan es un slide)
  const itemCount = planes.length;
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

  const scrollByPage = useCallback((direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = Math.max(280, Math.round(el.clientWidth * 0.52));
    el.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  }, []);

  const scrollLeft = useCallback(() => scrollByPage(-1), [scrollByPage]);

  const scrollRight = useCallback(() => scrollByPage(1), [scrollByPage]);

  // Memoizar la lista de planes para evitar re-renders innecesarios
  const planesCards = useMemo(
    () =>
      planes.map((plan) => (
        <div key={plan.id} className={styles.carouselSlide}>
          <PlanCard plan={plan} modelo={modeloSlug} />
        </div>
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
        <span className={styles.titleSep} aria-hidden="true" />
        <Link
          href="/planes"
          className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline} ${cta.buttonCompact} ${styles.verTodosButton}`}
        >
          Ver todos
        </Link>
      </div>

      {/* Carrusel: mismo patrón que 0 km (scrollButton + disabled) */}
      <section
        className={`${kmStyles.carouselSection} ${styles.planesCarouselSection}`}
        aria-label={`Planes de financiación ${modeloDisplay}`}
      >
        <div className={`${kmStyles.carouselWrapper} ${styles.carouselWrapperInPlanes}`}>
          <button
            type="button"
            className={`${kmStyles.scrollButton} ${kmStyles.scrollButtonLeft}`}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Planes anteriores"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            ref={scrollContainerRef}
            className={`${kmStyles.carousel} ${styles.carouselTrack}`}
          >
            {planesCards}
          </div>

          <button
            type="button"
            className={`${kmStyles.scrollButton} ${kmStyles.scrollButtonRight}`}
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Planes siguientes"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Indicador de páginas del carrusel */}
      <div className={styles.carouselDots}>
        <CarouselDots
          count={itemCount}
          activeIndex={activeItem}
          variant="planes"
          onDotClick={handleDotClick}
        />
      </div>
      </div>
    </section>
  );
};

export default ModeloPlanes;
