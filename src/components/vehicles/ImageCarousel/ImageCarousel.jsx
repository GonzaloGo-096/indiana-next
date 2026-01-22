"use client";

/**
 * ImageCarousel - Componente de carrusel de imágenes profesional
 * 
 * ✅ MEJORAS EN MOBILE:
 * - object-fit: contain para ver el auto completo (no zoom)
 * - Aspect ratio adecuado para vehículos
 * - Navegación por swipe/touch optimizada
 * - Lazy loading inteligente con Next.js Image
 * 
 * @author Indiana Peugeot
 * @version 2.0.0 - Next.js optimizado
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import styles from "./ImageCarousel.module.css";

const DEFAULT_CAR_IMAGE = "/assets/logos/logos-indiana/desktop/logo-chico-solid.webp";

/**
 * Componente ImageCarousel
 */
export const ImageCarousel = ({
  images = [],
  altText = "Imagen del vehículo",
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  onMainImageClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbnailRefs = useRef([]);
  const thumbnailsContainerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const mainImageContainerRef = useRef(null);

  // Si no hay imágenes, usar imagen por defecto
  const allImages = useMemo(() => {
    if (!images || images.length === 0) return [DEFAULT_CAR_IMAGE];
    // Normalizar: convertir objetos a strings si es necesario
    return images.map((img) => {
      if (typeof img === "string") return img;
      if (img?.url) return img.url;
      if (img?.secure_url) return img.secure_url;
      return DEFAULT_CAR_IMAGE;
    }).filter(Boolean);
  }, [images]);

  // ===== Navegación =====
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? allImages.length - 1 : prevIndex - 1
    );
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
    );
  }, [allImages.length]);

  const goToImage = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // ✅ Handlers para swipe/touch
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [goToNext, goToPrevious]);

  // AutoPlay
  useEffect(() => {
    if (!autoPlay || allImages.length <= 1) return;
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, goToNext, allImages.length]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Scroll automático de miniaturas
  useEffect(() => {
    if (thumbnailRefs.current[currentIndex] && thumbnailsContainerRef.current) {
      const thumbnail = thumbnailRefs.current[currentIndex];
      const container = thumbnailsContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const thumbnailRect = thumbnail.getBoundingClientRect();

      if (
        thumbnailRect.left < containerRect.left ||
        thumbnailRect.right > containerRect.right
      ) {
        thumbnail.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex]);

  const currentImage = allImages[currentIndex];

  return (
    <div className={styles.carouselContainer}>
      {/* Imagen principal */}
      <div
        ref={mainImageContainerRef}
        className={`${styles.mainImageContainer} ${
          onMainImageClick ? styles.mainImageClickable : ""
        }`}
        onClick={onMainImageClick ? () => onMainImageClick(currentIndex) : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role={onMainImageClick ? "button" : undefined}
        tabIndex={onMainImageClick ? 0 : undefined}
        onKeyDown={
          onMainImageClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onMainImageClick(currentIndex);
                }
              }
            : undefined
        }
        aria-label={
          onMainImageClick ? "Abrir galería en pantalla completa" : undefined
        }
      >
        {/* Imagen con efecto fade */}
        {currentImage && (
          <Image
            key={currentIndex} // Key para reiniciar animación
            src={currentImage}
            alt={`${altText} ${currentIndex + 1} de ${allImages.length}`}
            width={800}
            height={600}
            className={styles.mainImage}
            priority={currentIndex === 0} // ✅ LCP: Priorizar primera imagen above-the-fold
            quality={currentIndex === 0 ? 80 : 75} // ✅ Performance: Imagen más chica para cargar más rápido
            sizes="(max-width: 768px) 100vw, 600px" // ✅ Performance: Imagen más chica (600px) para cargar más rápido en desktop
            loading={currentIndex === 0 ? "eager" : "lazy"}
            fetchPriority={currentIndex === 0 ? "high" : "auto"}
          />
        )}

        {/* Flechas de navegación - Solo desktop */}
        {showArrows && allImages.length > 1 && (
          <>
            <button
              className={`${styles.mainArrow} ${styles.mainArrowLeft}`}
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              aria-label="Imagen anterior"
            >
              <ChevronIcon direction="left" size={24} />
            </button>
            <button
              className={`${styles.mainArrow} ${styles.mainArrowRight}`}
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="Imagen siguiente"
            >
              <ChevronIcon direction="right" size={24} />
            </button>
          </>
        )}

        {/* Contador de posición */}
        {allImages.length > 1 && (
          <div className={styles.positionCounter}>
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {allImages.length > 1 && (
        <div className={styles.thumbnailsContainer}>
          <div ref={thumbnailsContainerRef} className={styles.thumbnails}>
            {allImages.map((image, index) => (
              <button
                key={index}
                ref={(el) => (thumbnailRefs.current[index] = el)}
                className={`${styles.thumbnail} ${
                  index === currentIndex ? styles.active : ""
                }`}
                onClick={() => goToImage(index)}
                aria-label={`Ver imagen ${index + 1}`}
                type="button"
              >
                <Image
                  src={image}
                  alt={`Miniatura ${index + 1}`}
                  width={200}
                  height={150}
                  className={styles.thumbnailImage}
                  loading="lazy"
                  quality={75}
                  sizes="(max-width: 768px) 85px, 140px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;

