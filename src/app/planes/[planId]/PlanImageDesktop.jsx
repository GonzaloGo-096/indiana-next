"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import styles from "./plan-detalle.module.css";

/**
 * PlanImageDesktop - Client Component para renderizar imagen del plan solo en desktop
 * 
 * ✅ PERFORMANCE: Solo renderiza la imagen en desktop (≥1024px)
 * Evita cargar la imagen en mobile para ahorrar ancho de banda
 * 
 * ✅ HYDRATION-SAFE: Usa `mounted` para evitar errores de hidratación
 * 
 * @param {Object} props
 * @param {Object} props.imagenModelo - Objeto con { url, alt }
 */
export function PlanImageDesktop({ imagenModelo }) {
  const [mounted, setMounted] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // ✅ Asegurar que solo renderiza después de la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ No renderizar hasta después de la hidratación (evita error de hidratación)
  // ✅ No renderizar en mobile - ahorra carga
  if (!mounted || !isDesktop || !imagenModelo?.url) {
    return null;
  }

  return (
    <div className={styles.planImageColumn}>
      <Image
        src={imagenModelo.url}
        alt={imagenModelo.alt}
        width={600}
        height={400}
        className={styles.planImage}
        loading="lazy"
      />
    </div>
  );
}

