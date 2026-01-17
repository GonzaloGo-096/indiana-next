"use client";

import { useState, useEffect } from "react";

/**
 * Hook para detectar breakpoints con media queries
 * 
 * @param {string} query - Media query string (ej: "(min-width: 768px)")
 * @returns {boolean} - true si la query coincide
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);

    // Función para actualizar el estado
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Listener moderno
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }

    // El estado inicial ya se establece en useState, no necesitamos actualizarlo aquí
    // Solo actualizamos cuando cambia la media query

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Hook para detectar si es desktop (≥768px)
 * @returns {boolean}
 */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 768px)");
}

