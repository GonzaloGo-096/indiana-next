"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import ModelCard from "../ModelCard/ModelCard";
import styles from "../../app/0km/0km.module.css";

/**
 * VehiculosCarouselClient - Client Component para carrusel de vehículos
 * 
 * ✅ Responsabilidad: Solo interactividad del carrusel (scroll, botones)
 * ✅ Recibe: Lista de cards ya preparada desde Server Component
 * 
 * @param {Object} props
 * @param {Array} props.cards - Array de cards con { key, src, alt, titulo, slug }
 */
export function VehiculosCarouselClient({ cards }) {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
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

    const scrollAmount = direction === "left" ? -650 : 650;
    carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section
      className={styles.carouselSection}
      aria-label="Gama de Vehículos Peugeot 0km"
    >
      <div className={styles.carouselWrapper}>
        <button
          className={`${styles.scrollButton} ${styles.scrollButtonLeft}`}
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          aria-label="Ver modelos anteriores"
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
              />
            </div>
          ))}
        </div>

        <button
          className={`${styles.scrollButton} ${styles.scrollButtonRight}`}
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          aria-label="Ver más modelos"
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



