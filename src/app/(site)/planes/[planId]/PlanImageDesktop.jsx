"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./plan-detalle.module.css";

/**
 * PlanImageDesktop - Client Component para renderizar imagen del plan
 * 
 * Muestra la foto del auto en mobile (arriba) y desktop (columna izquierda)
 * 
 * ✅ HYDRATION-SAFE: Usa `mounted` para evitar errores de hidratación
 * 
 * @param {Object} props
 * @param {Object} props.imagenModelo - Objeto con { url, alt }
 */
export function PlanImageDesktop({ imagenModelo }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted || !imagenModelo?.url) {
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

