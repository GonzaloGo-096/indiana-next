"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./0km-detalle.module.css";

/**
 * HeroImageDesktop - Hero image para paginas de modelos 0km
 *
 * El contenedor se renderiza desde el servidor (visible en SSR) para que el
 * espacio quede reservado via CSS (aspect-ratio). La imagen se hidrata en el
 * cliente. Esto elimina el layout shift en desktop al aparecer el hero.
 *
 * En mobile, CSS oculta el contenedor con display:none - no ocupa espacio.
 *
 * @param {Object} props.heroImage - { url, alt, modelName }
 */
export function HeroImageDesktop({ heroImage }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!heroImage?.url) return null;

  return (
    <div className={styles.heroContainer}>
      <div className={styles.heroBadge}>NUEVO {heroImage.modelName || ""}</div>
      {mounted && (
        <Image
          src={heroImage.url}
          alt={heroImage.alt}
          width={1920}
          height={800}
          className={styles.heroImage}
          priority
          quality={85}
          sizes="(max-width: 767px) 1px, 100vw"
        />
      )}
    </div>
  );
}