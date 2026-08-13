"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * Hook para detectar tipo de dispositivo
 * 
 * @returns {Object} - { isMobile, isDesktop }
 */
export function useDevice() {
  // Una sola consulta. Antes se llamaba a useMediaQuery dos veces con la misma
  // media query —una para isMobile y otra para isDesktop— y eso abría dos
  // suscripciones al navegador y mantenía dos estados para el mismo dato.
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return {
    isMobile: !isDesktop,
    isDesktop,
  };
}



