"use client";

/**
 * PromocionesCarousel - Carrusel de imágenes de promociones en /usados
 *
 * Estrategia de rendimiento:
 * - Primera imagen: carga inmediata (eager, fetchPriority high) para LCP
 * - Imágenes 2 y 3: se cargan después del load de la página (requestIdleCallback)
 * - Controles (flechas/dots): solo visibles cuando hay al menos 2 slides listos
 *
 * @author Indiana Peugeot
 */
import { useState, useEffect, useCallback } from "react";
import { ChevronIcon } from "../../components/ui/icons/ChevronIcon";
import styles from "./usados.module.css";

const PROMOS_IMAGES = {
  desktop: [
    "https://res.cloudinary.com/drbeomhcu/image/upload/v1773938453/desktop-USADOS-05_jl1dk0.webp",
    "https://res.cloudinary.com/drbeomhcu/image/upload/v1773938452/desktop-USADOS-01_nl8mdy.webp",
    "https://res.cloudinary.com/drbeomhcu/image/upload/v1773956946/desktop-USADOS-03_wrvugk.webp",
  ],
  mobile: [
    "https://res.cloudinary.com/drbeomhcu/image/upload/v1773938440/mobile-USADOS-02_nzhg1x.webp",
    "https://res.cloudinary.com/drbeomhcu/image/upload/v1773956955/mobile-USADOS-04_wd1g0j.webp",
    "https://res.cloudinary.com/drbeomhcu/image/upload/v1773938440/mobile-USADOS-06_ya29wh.webp",
  ],
};

const ALT = "Promociones y formas de pago — Indiana Peugeot Usados";

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export default function PromocionesCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [slideCount, setSlideCount] = useState(1); // Solo 1 slide hasta que carguen las demás

  // Preload imágenes 2 y 3 (desktop y mobile) después del load de la página
  useEffect(() => {
    const loadExtraImages = () => {
      const toPreload = [
        ...PROMOS_IMAGES.desktop.slice(1),
        ...PROMOS_IMAGES.mobile.slice(1),
      ];
      Promise.all(toPreload.map(preloadImage))
        .then(() => {
          setSlideCount(3);
          setShowControls(true);
        })
        .catch(() => {
          setSlideCount(1);
        });
    };

    if (typeof window === "undefined") return;

    if (document.readyState === "complete") {
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
      idle(loadExtraImages);
    } else {
      const onLoad = () => {
        const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
        idle(loadExtraImages);
      };
      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  const goPrev = useCallback(() => {
    setCurrentSlide((s) => (s <= 0 ? slideCount - 1 : s - 1));
  }, [slideCount]);

  const goNext = useCallback(() => {
    setCurrentSlide((s) => (s >= slideCount - 1 ? 0 : s + 1));
  }, [slideCount]);

  return (
    <div className={styles.promosCarousel}>
      <div className={styles.promosCarouselTrack} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {Array.from({ length: slideCount }).map((_, i) => (
          <div key={i} className={styles.promosCarouselSlide}>
            <picture>
              <source media="(min-width: 769px)" srcSet={PROMOS_IMAGES.desktop[i]} />
              <source media="(max-width: 768px)" srcSet={PROMOS_IMAGES.mobile[i]} />
              <img
                src={PROMOS_IMAGES.mobile[i]}
                alt={ALT}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
                className={styles.promocionesImage}
              />
            </picture>
          </div>
        ))}
      </div>

      {showControls && slideCount > 1 && (
        <>
          <button
            type="button"
            className={styles.promosCarouselArrow}
            onClick={goPrev}
            aria-label="Ver promoción anterior"
          >
            <ChevronIcon direction="left" size={24} />
          </button>
          <button
            type="button"
            className={`${styles.promosCarouselArrow} ${styles.promosCarouselArrowRight}`}
            onClick={goNext}
            aria-label="Ver siguiente promoción"
          >
            <ChevronIcon direction="right" size={24} />
          </button>
          <div className={styles.promosCarouselDots} role="tablist" aria-label="Navegación de promociones">
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={currentSlide === i}
                aria-label={`Promoción ${i + 1}`}
                className={`${styles.promosCarouselDot} ${currentSlide === i ? styles.promosCarouselDotActive : ""}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
