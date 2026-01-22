"use client";

import { useState, useMemo, useEffect } from "react";
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
 * - Renderiza solo las imágenes necesarias según breakpoint (evita descargar imágenes innecesarias)
 * - Usa estado inicial mobile para evitar hidratación mismatch
 * 
 * @param {Object} props
 * @param {Object} props.images - Objeto con arrays mobile y desktop
 * @param {Array} props.images.mobile - Array de imágenes para mobile (4)
 * @param {Array} props.images.desktop - Array de imágenes para desktop (6)
 * @param {string} props.title - Título opcional para la sección
 */
export function ModelGallery({ images, title = "Galería" }) {
  if (!images) return null;

  // ✅ Estado para evitar hidratación: empezar con mobile (consistente servidor/cliente)
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // ✅ Detectar breakpoint después de montar para evitar mismatch
  useEffect(() => {
    setIsMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia("(min-width: 768px)").matches);
    };
    
    // Verificar inmediatamente
    checkDesktop();
    
    // Listener para cambios de tamaño
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e) => setIsDesktop(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // ✅ Seleccionar imágenes según breakpoint (solo las necesarias)
  const displayImages = useMemo(() => {
    // Antes de montar o en mobile: usar mobile (consistente servidor/cliente)
    if (!isMounted || !isDesktop) {
      if (images.mobile) {
        return images.mobile.slice(0, 4);
      }
      return (images.desktop || []).slice(0, 4);
    }
    
    // Después de montar y en desktop: usar desktop
    if (images.desktop) {
      return images.desktop.slice(0, 6);
    }
    return (images.mobile || []).slice(0, 6);
  }, [images, isDesktop, isMounted]);

  if (!displayImages.length) return null;

  // Estado para trackear qué imágenes han cargado
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImageLoad = (url) => {
    setLoadedImages((prev) => new Set([...prev, url]));
  };

  // Determinar estrategia de carga: primeras 2 imágenes eager, resto lazy
  const getLoadingStrategy = (index) => {
    return index < 2 ? "eager" : "lazy";
  };

  const getFetchPriority = (index) => {
    return index < 2 ? "high" : "auto";
  };

  return (
    <section className={styles.gallery} aria-label={`Galería de ${title}`}>
      {title && <h2 className={styles.galleryTitle}>{title}</h2>}

      <div className={styles.grid}>
        {displayImages.map((image, index) => {
          if (!image || !image.url) return null;

          const isLoaded = loadedImages.has(image.url);
          const isLoading = !isLoaded;

          return (
            <div key={image.url || index} className={styles.gridItem}>
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
                quality={index < 2 ? 85 : 75}
                loading={getLoadingStrategy(index)}
                fetchPriority={getFetchPriority(index)}
                onLoad={() => handleImageLoad(image.url)}
                onError={() => handleImageLoad(image.url)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

