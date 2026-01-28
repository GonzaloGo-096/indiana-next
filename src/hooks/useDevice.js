"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * Hook para detectar tipo de dispositivo
 * 
 * @returns {Object} - { isMobile, isDesktop }
 */
export function useDevice() {
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return {
    isMobile,
    isDesktop,
  };
}



