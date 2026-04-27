"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import cta from "@/components/home/HomeSectionCtas.module.css";
import styles from "./plan-detalle.module.css";

/**
 * PlanImageDesktop - Client Component para renderizar imagen del plan
 *
 * Muestra la foto del auto en mobile (arriba) y desktop (columna izquierda).
 * Opcional: enlace "Ver modelo" abajo a la izquierda → /0km/[slug]
 *
 * ✅ HYDRATION-SAFE: Usa `mounted` para evitar errores de hidratación
 *
 * @param {Object} props
 * @param {Object} props.imagenModelo - Objeto con { url, alt }
 * @param {string} [props.modeloSlug] - Slug del modelo (ej. "2008", "partner")
 */
export function PlanImageDesktop({ imagenModelo, modeloSlug }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted || !imagenModelo?.url) {
    return null;
  }

  const modeloHref = modeloSlug ? `/0km/${encodeURIComponent(modeloSlug)}` : null;

  return (
    <div className={styles.planImageColumn}>
      <div className={styles.planImageInner}>
        <Image
          src={imagenModelo.url}
          alt={imagenModelo.alt}
          width={960}
          height={640}
          className={styles.planImage}
          sizes="(max-width: 1023px) 100vw, (max-width: 1280px) 50vw, 640px"
          loading="lazy"
        />
        {modeloHref && (
          <Link
            href={modeloHref}
            className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline} ${styles.verModeloLink}`}
            aria-label={`Ver ficha del modelo en 0km`}
          >
            Ver modelo
          </Link>
        )}
      </div>
    </div>
  );
}

