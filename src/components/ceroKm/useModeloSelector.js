"use client";

import { useState, useCallback, useMemo } from "react";
import { getModelo, COLORES } from "../../data/modelos";

/**
 * Hook para manejar selección de versión y color de un modelo
 * 
 * @param {string} modeloSlug - Slug del modelo (ej: '2008')
 * @returns {Object} - Estado y funciones de selección
 */
export function useModeloSelector(modeloSlug) {
  const modelo = useMemo(() => getModelo(modeloSlug), [modeloSlug]);
  const versiones = useMemo(() => modelo?.versiones || [], [modelo]);
  const versionInicial = useMemo(() => versiones[0] || null, [versiones]);

  // Estado: versión y color activos (siempre inicializar, incluso si no hay modelo)
  const [versionActivaId, setVersionActivaId] = useState(
    versionInicial?.id || null
  );
  const [colorActivoKey, setColorActivoKey] = useState(
    versionInicial?.colorDefault || null
  );

  // Versión activa (objeto completo)
  const versionActiva = useMemo(() => {
    if (!versiones.length) return null;
    return versiones.find((v) => v.id === versionActivaId) || versionInicial;
  }, [versiones, versionActivaId, versionInicial]);

  // Colores disponibles para la versión activa
  const coloresDisponibles = useMemo(() => {
    if (!versionActiva?.coloresPermitidos) return [];
    return versionActiva.coloresPermitidos
      .map((colorKey) => COLORES[colorKey])
      .filter(Boolean);
  }, [versionActiva]);

  // Color activo (objeto completo)
  const colorActivo = useMemo(() => {
    return (
      coloresDisponibles.find((c) => c.key === colorActivoKey) ||
      coloresDisponibles[0]
    );
  }, [coloresDisponibles, colorActivoKey]);

  // Imagen actual basada en versión y color
  const imagenActual = useMemo(() => {
    if (!modelo) {
      return { url: null, alt: "", hasImage: false };
    }

    // Si no hay colores disponibles, usar imagen principal del modelo
    if (!coloresDisponibles.length && modelo.imagenPrincipal) {
      return {
        url: modelo.imagenPrincipal.url,
        alt:
          modelo.imagenPrincipal.alt ||
          `${modelo.nombre} ${versionActiva?.nombreCorto || ""}`,
        hasImage: !!modelo.imagenPrincipal.url,
      };
    }

    // Si hay colores, usar el color activo
    const color = COLORES[colorActivoKey];
    if (!color) {
      return { url: null, alt: "", hasImage: false };
    }
    return {
      url: color.url,
      alt: `${modelo.nombre} ${versionActiva?.nombreCorto || ""} ${color.label}`,
      hasImage: !!color.url,
    };
  }, [colorActivoKey, modelo, versionActiva, coloresDisponibles]);

  // Índice de versión activa (para navegación)
  const indiceVersionActiva = useMemo(() => {
    return versiones.findIndex((v) => v.id === versionActivaId);
  }, [versiones, versionActivaId]);

  /**
   * Cambiar versión activa
   * - Resetea el color al default de la nueva versión
   */
  const cambiarVersion = useCallback(
    (versionId) => {
      if (!versiones.length) return;
      const nuevaVersion = versiones.find((v) => v.id === versionId);
      if (!nuevaVersion) return;

      setVersionActivaId(versionId);

      // Resetear al color default de la nueva versión
      // (siempre resetear para evitar problemas de sincronización)
      setColorActivoKey(nuevaVersion.colorDefault || null);
    },
    [versiones]
  );

  /**
   * Cambiar versión por índice (para swipe en mobile)
   */
  const cambiarVersionPorIndice = useCallback(
    (indice) => {
      const version = versiones[indice];
      if (version) {
        cambiarVersion(version.id);
      }
    },
    [versiones, cambiarVersion]
  );

  /**
   * Cambiar color activo
   * - Solo permite colores válidos para la versión actual
   */
  const cambiarColor = useCallback(
    (colorKey) => {
      if (!versionActiva) return;
      const colorValido = versionActiva.coloresPermitidos?.includes(colorKey);
      if (colorValido) {
        setColorActivoKey(colorKey);
      }
    },
    [versionActiva]
  );

  // Si no existe el modelo, retornar estado vacío
  if (!modelo) {
    return {
      modelo: null,
      versiones: [],
      versionActiva: null,
      colorActivo: null,
      coloresDisponibles: [],
      imagenActual: { url: null, alt: "", hasImage: false },
      cambiarVersion: () => {},
      cambiarColor: () => {},
      cambiarVersionPorIndice: () => {},
      indiceVersionActiva: 0,
      totalVersiones: 0,
      puedeIrAnterior: false,
      puedeIrSiguiente: false,
      error: `Modelo "${modeloSlug}" no encontrado`,
    };
  }

  return {
    // Data del modelo
    modelo,
    versiones,

    // Estado actual
    versionActiva,
    colorActivo,
    coloresDisponibles,
    imagenActual,

    // Navegación
    indiceVersionActiva,
    totalVersiones: versiones.length,
    puedeIrAnterior: indiceVersionActiva > 0,
    puedeIrSiguiente: indiceVersionActiva < versiones.length - 1,

    // Acciones
    cambiarVersion,
    cambiarVersionPorIndice,
    cambiarColor,

    // Estado de error
    error: null,
  };
}

