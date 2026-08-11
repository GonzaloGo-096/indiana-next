"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import ModelCard from "../ModelCard/ModelCard";
import styles from "@/app/(site)/0km/0km.module.css";

/**
 * UtilitariosCarouselClient - Client Component para carrusel de utilitarios
 * 
 * ✅ Responsabilidad: Solo interactividad del carrusel (scroll, botones)
 * ✅ Recibe: Lista de cards ya preparada desde Server Component
 * 
 * @param {Object} props
 * @param {Array} props.cards - Array de cards con { key, src, alt, titulo, slug }
 * @param {boolean} props.compact - Cards más compactas (presentación home)
 * @param {boolean} props.softSurface - Superficie suave para presentación moderna
 * @param {boolean} props.frameless - Sin caja de card (solo auto + título)
 * @param {boolean} props.showActionButtons - Mostrar CTAs debajo de cada auto
 * @param {boolean} props.fullViewport - Sección a ancho completo del viewport
 * @param {boolean} props.okmShowcase - Estilos exclusivos para /0km
 */
export function UtilitariosCarouselClient({
  cards,
  compact = false,
  softSurface = false,
  frameless = false,
  showActionButtons = false,
  fullViewport = false,
  okmShowcase = false,
}) {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScrollButtons = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const items = Array.from(carousel.children);
    if (!items.length) {
      setActiveIndex(0);
      return;
    }
    const viewportCenter = scrollLeft + clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Number.POSITIVE_INFINITY;
    items.forEach((item, idx) => {
      const itemCenter = item.offsetLeft + item.clientWidth / 2;
      const dist = Math.abs(itemCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    setActiveIndex(closestIdx);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Verificar estado inicial
    checkScrollButtons();
    
    // ✅ OPTIMIZADO: Usar requestAnimationFrame para scroll (más eficiente)
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        checkScrollButtons();
        rafId = null;
      });
    };
    
    // ✅ OPTIMIZADO: Debounce para resize (evita ejecuciones excesivas)
    let resizeTimeout = null;
    const onResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        checkScrollButtons();
      }, 150);
    };
    
    carousel.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      carousel.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId) cancelAnimationFrame(rafId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [checkScrollButtons]);

  const scroll = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const step = softSurface ? 960 : 650;
    const scrollAmount = direction === "left" ? -step : step;
    carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollToIndex = useCallback((index) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const item = carousel.children[index];
    if (!(item instanceof HTMLElement)) return;
    item.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  return (
    <section
      className={`${styles.carouselSection} ${styles.utilitariosSection} ${
        fullViewport ? styles.carouselSectionFullViewport : ""
      }`}
      aria-label="Gama de Utilitarios Peugeot"
    >
      {cards.length > 1 && (
        <div className={styles.carouselProgressDots} aria-label="Posición del carrusel">
          {cards.map((card, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${card.key}-dot`}
                type="button"
                className={`${styles.carouselProgressDot} ${isActive ? styles.carouselProgressDotActive : ""}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={`Ir al utilitario ${idx + 1}`}
                aria-current={isActive ? "true" : "false"}
              />
            );
          })}
        </div>
      )}
      <div className={styles.carouselWrapper}>
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Ver utilitarios anteriores"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={carouselRef}
          className={styles.carousel}
          role="list"
          aria-label="Carrusel de modelos - utilitarios"
        >
          {cards.map((card) => (
            <div key={card.key} role="listitem">
              <ModelCard
                src={card.src}
                alt={card.alt}
                titulo={card.titulo}
                slug={card.slug}
                versionLabels={card.versionLabels}
                hasPlanes={card.hasPlanes}
                showActionButtons={showActionButtons}
                okmShowcase={okmShowcase}
                compact={compact}
                softSurface={softSurface}
                frameless={frameless}
              />
            </div>
          ))}
        </div>

        <button
          className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Ver más utilitarios"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}



