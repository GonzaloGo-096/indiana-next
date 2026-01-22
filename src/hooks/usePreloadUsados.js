"use client";

import { useEffect, useRef } from "react";

/**
 * Hook para precalentar imágenes y datos de vehículos usados
 * 
 * Estrategia:
 * 1. Precalentar primeros 6-8 vehículos cuando se carga la página de inicio
 * 2. Precalentar siguientes vehículos cuando el usuario interactúa con el carrusel
 * 
 * @param {Array} vehiculos - Array de vehículos usados
 * @param {Object} options - Opciones de precalentamiento
 * @param {number} options.initialCount - Cantidad inicial a precalentar (default: 6)
 * @param {number} options.batchSize - Tamaño del batch para precalentar siguiente (default: 4)
 */
export function usePreloadUsados(vehiculos = [], options = {}) {
  const { initialCount = 6, batchSize = 4 } = options;
  const preloadedRef = useRef(new Set());
  const currentBatchRef = useRef(0);

  // Precalentar imágenes de los primeros vehículos iniciales
  useEffect(() => {
    if (!vehiculos || vehiculos.length === 0) return;

    const initialVehiculos = vehiculos.slice(0, initialCount);

    initialVehiculos.forEach((vehiculo, index) => {
      if (preloadedRef.current.has(vehiculo.id)) return;

      // Precalentar imagen principal
      if (vehiculo.imagenPrincipal || vehiculo.imagen) {
        const img = new Image();
        const imageUrl = vehiculo.imagenPrincipal?.url || vehiculo.imagen;
        
        img.src = imageUrl;
        img.onload = () => {
          preloadedRef.current.add(vehiculo.id);
        };
        img.onerror = () => {
          // Marcar como precalentado incluso si falla para no reintentar
          preloadedRef.current.add(vehiculo.id);
        };
      } else {
        preloadedRef.current.add(vehiculo.id);
      }
    });
  }, [vehiculos, initialCount]);

  // Función para precalentar siguiente batch
  const preloadNextBatch = () => {
    if (!vehiculos || vehiculos.length === 0) return;

    const startIndex = initialCount + currentBatchRef.current * batchSize;
    const endIndex = startIndex + batchSize;
    const nextBatch = vehiculos.slice(startIndex, endIndex);

    if (nextBatch.length === 0) return;

    nextBatch.forEach((vehiculo) => {
      if (preloadedRef.current.has(vehiculo.id)) return;

      // Precalentar imagen principal
      if (vehiculo.imagenPrincipal || vehiculo.imagen) {
        const img = new Image();
        const imageUrl = vehiculo.imagenPrincipal?.url || vehiculo.imagen;
        
        img.src = imageUrl;
        img.onload = () => {
          preloadedRef.current.add(vehiculo.id);
        };
        img.onerror = () => {
          preloadedRef.current.add(vehiculo.id);
        };
      } else {
        preloadedRef.current.add(vehiculo.id);
      }
    });

    currentBatchRef.current += 1;
  };

  return {
    preloadNextBatch,
    isPreloaded: (vehiculoId) => preloadedRef.current.has(vehiculoId),
  };
}


