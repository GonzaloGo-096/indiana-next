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
 * - Next/Image con loading optimizado
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
  // ✅ Estado para evitar hidratación: empezar con mobile (consistente servidor/cliente)
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    queueMicrotask(() => {
      setIsMounted(true);
      checkDesktop();
    });

    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // ✅ Memoizar imágenes según breakpoint (images ausente → [])
  const imagesToShow = useMemo(() => {
    if (!images) return [];
    if (!isMounted) return images.mobile || [];
    return isDesktop ? (images.desktop || images.mobile || []) : (images.mobile || []);
  }, [isDesktop, isMounted, images]);

  // Validación (después de todos los hooks)
  if (!images || !imagesToShow.length) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="gallery-title">
      <div className={styles.container}>
        <h2 id="gallery-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.grid}>
          {imagesToShow.map((img, index) => {
            if (!img || !img.url) return null;

            // ✅ Primeras 2-3 imágenes con loading="eager" para LCP
            const isPriority = index < 3;
            const isFirst = index === 0;

            return (
              <div key={img.url || index} className={styles.gridItem}>
                <Image
                  src={img.url}
                  alt={img.alt || `${title} - Imagen ${index + 1}`}
                  width={800}
                  height={600}
                  className={styles.gridImage}
                  loading={isPriority ? "eager" : "lazy"}
                  priority={isFirst}
                  quality={85}
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ✅ Agregar default export para compatibilidad con dynamic imports
export default ModelGallery;
