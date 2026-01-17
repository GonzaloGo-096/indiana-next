"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ModelGallery.module.css";

/**
 * ModelGallery - Galería de imágenes del modelo
 * 
 * Grid responsive:
 * - Mobile: 2x2 (4 imágenes)
 * - Desktop: 3x2 (6 imágenes)
 * 
 * Optimizaciones:
 * - Primeras 2-3 imágenes con loading="eager" para carga prioritaria
 * - Placeholder/skeleton mientras cargan
 * - Mejor sizes para optimización de Next.js
 * 
 * @param {Object} props
 * @param {Object} props.images - Objeto con arrays mobile y desktop
 * @param {Array} props.images.mobile - Array de imágenes para mobile (4)
 * @param {Array} props.images.desktop - Array de imágenes para desktop (6)
 * @param {string} props.title - Título opcional para la sección
 */
export function ModelGallery({ images, title = "Galería" }) {
  if (!images) return null;

  // Usar desktop si está disponible, sino mobile
  const displayImages = images.desktop || images.mobile || [];
  
  // Limitar a 6 imágenes máximo para desktop (3x2)
  const limitedImages = displayImages.slice(0, 6);

  if (!limitedImages.length) return null;

  // Estado para trackear qué imágenes han cargado
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImageLoad = (index) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  // Determinar estrategia de carga: primeras 2-3 imágenes eager, resto lazy
  const getLoadingStrategy = (index) => {
    // Primeras 2 imágenes: eager (mobile) o primeras 3 (desktop)
    return index < 2 ? "eager" : "lazy";
  };

  const getFetchPriority = (index) => {
    // Solo las primeras 2 imágenes tienen alta prioridad
    return index < 2 ? "high" : "auto";
  };

  return (
    <section className={styles.gallery} aria-label={`Galería de ${title}`}>
      {title && <h2 className={styles.galleryTitle}>{title}</h2>}

      <div className={styles.grid}>
        {limitedImages.map((image, index) => {
          const isLoaded = loadedImages.has(index);
          const isLoading = !isLoaded && image.url;

          return (
            <div key={image.url || index} className={styles.gridItem}>
              {image.url ? (
                <>
                  {/* Skeleton/Placeholder mientras carga */}
                  {isLoading && (
                    <div className={styles.imageSkeleton} aria-hidden="true">
                      <div className={styles.skeletonShimmer} />
                    </div>
                  )}
                  
                  <Image
                    src={image.url}
                    alt={image.alt || `${title} - Imagen ${index + 1}`}
                    width={600}
                    height={450}
                    className={`${styles.gridImage} ${isLoaded ? styles.loaded : styles.loading}`}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px"
                    quality={index < 2 ? 85 : 75} // Mejor calidad para primeras imágenes
                    loading={getLoadingStrategy(index)}
                    fetchPriority={getFetchPriority(index)}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageLoad(index)} // Marcar como "cargado" incluso si falla
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </>
              ) : (
                <div
                  className={styles.imagePlaceholder}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-neutral-400)",
                    fontSize: "0.875rem",
                  }}
                >
                  Imagen no disponible
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

