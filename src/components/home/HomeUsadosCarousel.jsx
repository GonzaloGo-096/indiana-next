"use client";

/**
 * HomeUsadosCarousel - Carrusel de usados solo para la sección de inicio
 *
 * Mobile: mismo estilo y espaciado que hasta ahora (viewportClip + compact).
 * Desktop: mismo carrusel que la página /usados (contenido, sin viewportClip),
 *          así la separación horizontal y el layout son idénticos.
 *
 * @author Indiana Peugeot
 */
import { useState, useEffect } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import UsadosCarousel from "../usados/UsadosCarousel";

export function HomeUsadosCarousel({ vehicles = [] }) {
  const [mounted, setMounted] = useState(false);
  const isMobile = !useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mobile: viewportClip + compact (estilos y espaciado actuales del inicio).
  // Desktop: sin viewportClip y sin compact = mismo comportamiento que página /usados.
  const useMobileStyle = mounted && isMobile;

  return (
    <UsadosCarousel
      vehicles={vehicles}
      compact={useMobileStyle}
      viewportClip={useMobileStyle}
    />
  );
}
