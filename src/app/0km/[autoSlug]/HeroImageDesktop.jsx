"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import styles from "./0km-detalle.module.css";

/**
 * HeroImageDesktop - Client Component para renderizar hero image solo en desktop
 * 
 * ✅ PERFORMANCE: Solo renderiza la imagen en desktop (≥768px)
 * Evita cargar la imagen en mobile para ahorrar ancho de banda
 * 
 * ✅ HYDRATION-SAFE: Usa `mounted` para evitar errores de hidratación
 * 
 * @param {Object} props
 * @param {Object} props.heroImage - Objeto con { url, alt }
 */
export function HeroImageDesktop({ heroImage }) {
  const [mounted, setMounted] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // ✅ Asegurar que solo renderiza después de la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ No renderizar hasta después de la hidratación (evita error de hidratación)
  // ✅ No renderizar en mobile - ahorra carga
  if (!mounted || !isDesktop || !heroImage?.url) {
    return null;
  }

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroBadge}>NUEVO {heroImage.modelName || ""}</div>
      <Image
        src={heroImage.url}
        alt={heroImage.alt}
        width={1920}
        height={800}
        className={styles.heroImage}
        priority
        quality={85}
        sizes="1200px"
      />
    </div>
  );
}

