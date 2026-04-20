"use client";

/**
 * UsadosPageCarousel - Carrusel de usados en la página /usados
 *
 * En mobile imita al carrusel de usados del inicio (full-bleed, compact).
 * En desktop mantiene el carrusel contenido.
 *
 * @author Indiana Peugeot
 */
import { useState, useEffect } from "react";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import UsadosCarousel from "../../../components/usados/UsadosCarousel";

export default function UsadosPageCarousel({ vehicles = [] }) {
  const [mounted, setMounted] = useState(false);
  const isMobile = !useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  // Hasta montar, mostramos estilo desktop (contenido) para evitar flash en desktop
  const mobileStyleHome = mounted && isMobile;

  return (
    <UsadosCarousel
      vehicles={vehicles}
      compact={mobileStyleHome}
      viewportClip={mobileStyleHome}
      flushLeadingEdge
    />
  );
}
