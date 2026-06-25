"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./MainImageCarousel.module.css";

/**
 * MainImageCarousel - Carrusel de imágenes principales para modelos sin colores.
 *
 * Muestra una imagen grande con flechas (desktop) y miniaturas clickeables debajo.
 * Soporta swipe táctil en mobile y navegación por teclado (← →).
 *
 * @param {Object} props
 * @param {Array} props.images - [{ url, alt }]
 * @param {string} [props.modelName] - Nombre del modelo (para alt fallback)
 * @param {string} [props.modelSlug] - Slug del modelo (para overrides de estilo)
 * @param {boolean} [props.priorityFirst] - Si la primera imagen es prioritaria (LCP)
 */
function MainImageCarouselImpl({
  images = [],
  modelName = "",
  modelSlug,
  priorityFirst = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = images.length;
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const containerRef = useRef(null);

  const goTo = useCallback(
    (index) => {
      if (!total) return;
      const safe = ((index % total) + total) % total;
      setActiveIndex(safe);
    },
    [total]
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // Navegación por teclado cuando el contenedor tiene foco
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  // Swipe en mobile
  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      if (startX == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - (startY ?? 0);
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev]
  );

  // Precarga sutil del siguiente / anterior
  useEffect(() => {
    if (typeof window === "undefined" || total <= 1) return;
    const next = images[(activeIndex + 1) % total];
    const prev = images[(activeIndex - 1 + total) % total];
    [next, prev].forEach((img) => {
      if (img?.url) {
        const i = new window.Image();
        i.src = img.url;
      }
    });
  }, [activeIndex, images, total]);

  if (!total) return null;

  const current = images[activeIndex];
  const currentAlt = current.alt || `${modelName} - Imagen ${activeIndex + 1}`;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      data-model-slug={modelSlug || undefined}
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Carrusel de imágenes de ${modelName || "modelo"}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.mainArea}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {total > 1 && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={goPrev}
            aria-label="Imagen anterior"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div className={styles.imageWrap}>
          {images.map((img, i) => {
            const isActive = i === activeIndex;
            return (
              <Image
                key={img.url || i}
                src={img.url}
                alt={img.alt || currentAlt}
                width={1200}
                height={800}
                className={`${styles.image} ${isActive ? styles.imageActive : ""}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 720px"
                quality={85}
                priority={priorityFirst && i === 0}
                loading={priorityFirst && i === 0 ? "eager" : "lazy"}
                aria-hidden={!isActive}
              />
            );
          })}
        </div>

        {total > 1 && (
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={goNext}
            aria-label="Imagen siguiente"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {total > 1 && (
          <span className={styles.counter} aria-hidden="true">
            {activeIndex + 1} / {total}
          </span>
        )}
      </div>

      {total > 1 && (
        <div
          className={styles.thumbnails}
          role="tablist"
          aria-label="Miniaturas"
        >
          {images.map((img, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={`thumb-${img.url || i}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Ver imagen ${i + 1} de ${total}`}
                className={`${styles.thumb} ${isActive ? styles.thumbActive : ""}`}
                onClick={() => goTo(i)}
                tabIndex={isActive ? 0 : -1}
              >
                <Image
                  src={img.url}
                  alt=""
                  width={160}
                  height={120}
                  className={styles.thumbImage}
                  sizes="96px"
                  quality={70}
                  loading="lazy"
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const MainImageCarousel = memo(MainImageCarouselImpl);
MainImageCarousel.displayName = "MainImageCarousel";

export default MainImageCarousel;
