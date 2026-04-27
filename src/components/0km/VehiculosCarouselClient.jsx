"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import ModelCard from "../ModelCard/ModelCard";
import styles from "../../app/(site)/0km/0km.module.css";

/**
 * VehiculosCarouselClient - Client Component para carrusel de vehículos
 *
 * ✅ Responsabilidad: Solo interactividad del carrusel (scroll, botones)
 * ✅ Recibe: Lista de cards ya preparada desde Server Component
 *
 * @param {Object} props
 * @param {Array} props.cards - Array de cards con { key, src, alt, titulo, slug }
 * @param {string} props.variant - 'default' | 'dark' - Variante para fondos claros u oscuros (botones)
 * @param {boolean} props.compact - Cards más pequeñas (para home)
 * @param {boolean} props.fillParentWidth - Ancho del track = padre (home)
 * @param {boolean} props.softSurface - Cards menos contrastadas + más grandes y separadas (solo home / fondo oscuro)
 * @param {boolean} props.frameless - Sin fondo ni borde de card (solo home / degradé)
 * @param {boolean} props.bleedEdges - Ancho viewport, track al borde (home 0 km)
 * @param {boolean} props.showActionButtons - Mostrar CTAs debajo de cada auto
 * @param {boolean} props.fullViewport - Sección a ancho completo del viewport
 * @param {boolean} props.okmShowcase - Estilos exclusivos para /0km
 */
export function VehiculosCarouselClient({
  cards,
  variant = "default",
  compact = false,
  fillParentWidth = false,
  softSurface = false,
  frameless = false,
  bleedEdges = false,
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

    checkScrollButtons();

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        checkScrollButtons();
        rafId = null;
      });
    };

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

  const sectionClass = [
    styles.carouselSection,
    styles.vehiculosSection,
    variant === "dark" ? styles.carouselSectionDark : "",
    fillParentWidth ? styles.carouselSectionHomeDesktop : "",
    fillParentWidth && softSurface ? styles.carouselSectionHomeSpacious : "",
    bleedEdges ? styles.carouselSectionBleed : "",
    fullViewport ? styles.carouselSectionFullViewport : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={sectionClass}
      aria-label="Gama de Vehículos Peugeot 0km"
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
                aria-label={`Ir al auto ${idx + 1}`}
                aria-current={isActive ? "true" : "false"}
              />
            );
          })}
        </div>
      )}
      <div
        className={`${styles.carouselWrapper}${fillParentWidth ? ` ${styles.carouselWrapperHome}` : ""}`}
      >
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Ver vehículos anteriores"
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
          aria-label="Carrusel de modelos - vehículos"
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
          aria-label="Ver más vehículos"
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
