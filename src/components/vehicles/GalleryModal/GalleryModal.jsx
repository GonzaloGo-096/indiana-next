"use client";

/**
 * GalleryModal - Lightbox modal para ver imágenes en grande
 * 
 * Features:
 * - Navegación prev/next
 * - Cierre con botón, overlay, tecla Escape
 * - Bloquea scroll del body
 * - Render condicional (solo se monta cuando está abierto)
 * - Optimizado con Next.js Image
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Next.js
 */

import { memo, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import styles from "./GalleryModal.module.css";

/**
 * GalleryModal Component
 */
export const GalleryModal = memo(
  ({
    isOpen,
    onClose,
    images = [],
    activeIndex = 0,
    onIndexChange,
    modelName = "Vehículo",
  }) => {
    const [mounted, setMounted] = useState(false);

    // Solo renderizar en cliente
    useEffect(() => {
      setMounted(true);
    }, []);

    // Navegación
    const goToPrev = useCallback(() => {
      const newIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
      onIndexChange?.(newIndex);
    }, [activeIndex, images.length, onIndexChange]);

    const goToNext = useCallback(() => {
      const newIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
      onIndexChange?.(newIndex);
    }, [activeIndex, images.length, onIndexChange]);

    // Bloquear scroll del body
    useEffect(() => {
      if (isOpen) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }, [isOpen]);

    // Manejo de teclado
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e) => {
        switch (e.key) {
          case "Escape":
            onClose?.();
            break;
          case "ArrowLeft":
            e.preventDefault();
            goToPrev();
            break;
          case "ArrowRight":
            e.preventDefault();
            goToNext();
            break;
          default:
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, goToPrev, goToNext]);

    // No renderizar si está cerrado o no está montado
    if (!mounted || !isOpen || !images.length) return null;

    const currentImage = images[activeIndex];
    const imageUrl = typeof currentImage === "string" 
      ? currentImage 
      : currentImage?.url || "";

    const modalContent = (
      <div
        className={styles.modalOverlay}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Galería de ${modelName}`}
      >
        {/* Contenedor del modal - detener propagación de click */}
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar galería"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Imagen principal */}
          <div className={styles.modalImageContainer}>
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={typeof currentImage === "object" && currentImage?.alt 
                  ? currentImage.alt 
                  : `${modelName} - Imagen ${activeIndex + 1}`}
                width={1200}
                height={900}
                className={styles.modalImage}
                priority
                quality={90}
                sizes="100vw"
                style={{ objectFit: "contain" }}
              />
            )}
          </div>

          {/* Navegación */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                className={`${styles.modalNavBtn} ${styles.modalNavPrev}`}
                onClick={goToPrev}
                aria-label="Imagen anterior"
              >
                <ChevronIcon direction="left" size={32} />
              </button>
              <button
                type="button"
                className={`${styles.modalNavBtn} ${styles.modalNavNext}`}
                onClick={goToNext}
                aria-label="Imagen siguiente"
              >
                <ChevronIcon direction="right" size={32} />
              </button>

              {/* Contador */}
              <div className={styles.modalCounter}>
                {activeIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Miniaturas en desktop */}
          {images.length > 1 && (
            <div className={styles.modalThumbnails}>
              {images.map((image, index) => {
                const imgUrl = typeof image === "string" 
                  ? image 
                  : image?.url || "";
                return (
                  <button
                    key={imgUrl || index}
                    type="button"
                    className={`${styles.modalThumb} ${
                      index === activeIndex ? styles.modalThumbActive : ""
                    }`}
                    onClick={() => onIndexChange?.(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Miniatura ${index + 1}`}
                      width={120}
                      height={90}
                      className={styles.modalThumbImage}
                      loading="lazy"
                      quality={75}
                      sizes="120px"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );

    // Usar portal para renderizar fuera del árbol DOM normal
    return createPortal(modalContent, document.body);
  }
);

GalleryModal.displayName = "GalleryModal";

export default GalleryModal;

