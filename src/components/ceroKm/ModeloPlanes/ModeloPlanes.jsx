"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPlanesPorModelo } from "../../../data/planes";
import { getModelo, COLORES } from "../../../data/modelos";
import { PlanCard } from "../../planes/PlanCard";
import { CarouselDots } from "../../ui/CarouselDots/CarouselDots";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import { PeugeotIcon } from "../../ui/icons/PeugeotIcon";
import { getClosestChildIndex, scrollToChildIndex } from "../../../utils/carouselActiveIndex";
import styles from "./ModeloPlanes.module.css";

/**
 * Obtener imagen para un modelo específico
 * - Para 208: incluir blanco (es el único color disponible)
 * - Para otros modelos: excluir blanco y variar entre los demás colores
 * - Si no hay colores disponibles, usar imagenPrincipal del modelo
 * @param {string} modeloSlug - Slug del modelo (2008, 208, expert, partner)
 * @param {number} planIndex - Índice del plan para variar el color
 * @returns {Object|null} - Objeto con { url, alt } o null
 */
const obtenerImagenPorModelo = (modeloSlug, planIndex = 0) => {
  const modelo = getModelo(modeloSlug);
  if (!modelo) {
    return null;
  }

  // Si no hay versiones, usar imagenPrincipal como fallback
  if (!modelo.versiones || modelo.versiones.length === 0) {
    if (modelo.imagenPrincipal && modelo.imagenPrincipal.url) {
      return {
        url: modelo.imagenPrincipal.url,
        alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}`,
      };
    }
    return null;
  }

  // Obtener todos los colores disponibles de todas las versiones del modelo
  const coloresDisponibles = new Set();
  modelo.versiones.forEach((version) => {
    if (version.coloresPermitidos) {
      version.coloresPermitidos.forEach((colorKey) => {
        coloresDisponibles.add(colorKey);
      });
    }
  });

  // Convertir a array y obtener objetos color
  const coloresArray = Array.from(coloresDisponibles)
    .map((colorKey) => COLORES[colorKey])
    .filter(Boolean);

  // Si no hay colores, usar imagenPrincipal como fallback
  if (coloresArray.length === 0) {
    if (modelo.imagenPrincipal && modelo.imagenPrincipal.url) {
      return {
        url: modelo.imagenPrincipal.url,
        alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}`,
      };
    }
    return null;
  }

  // Para 208: incluir todos los colores (blanco es el único disponible)
  // Para otros modelos: excluir blanco
  const coloresFiltrados =
    modeloSlug === "208"
      ? coloresArray
      : coloresArray.filter((color) => {
          const key = color.key.toLowerCase();
          return !key.includes("blanco") && !key.includes("white");
        });

  // Si después de filtrar no hay colores, usar todos los disponibles
  const coloresFinales =
    coloresFiltrados.length > 0 ? coloresFiltrados : coloresArray;

  // Seleccionar color basado en el índice del plan (para variar entre planes)
  const indiceColor = planIndex % coloresFinales.length;
  const colorSeleccionado = coloresFinales[indiceColor];

  if (!colorSeleccionado || !colorSeleccionado.url) {
    // Fallback a imagenPrincipal si el color no tiene URL
    if (modelo.imagenPrincipal && modelo.imagenPrincipal.url) {
      return {
        url: modelo.imagenPrincipal.url,
        alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}`,
      };
    }
    return null;
  }

  return {
    url: colorSeleccionado.url,
    alt: `Peugeot ${modelo.nombre} ${colorSeleccionado.label}`,
  };
};

/**
 * Función para obtener versión del plan basándose en el nombre del plan y los modelos
 * @param {Object} plan - Objeto del plan
 * @param {string} modeloSlug - Slug del modelo (2008, 208, expert, partner)
 * @returns {string} - Nombre de la versión
 */
const obtenerVersionDelPlan = (plan, modeloSlug) => {
  const modeloData = getModelo(modeloSlug);
  if (!modeloData || !modeloData.versiones) return "";

  const nombrePlan = plan.plan.toLowerCase();
  const modelosPlan = plan.modelos.map((m) => m.toLowerCase());

  // Mapeo específico por plan
  const mapeoVersiones = {
    "2008-allure-t200": "ALLURE",
    "2008-active-t200": "ACTIVE",
    easy: "ALLURE",
    "plus-at": "ALLURE AT",
    "plus-208": "ALLURE",
    "expert-carga": "L3 HDI 120 - Carga",
    "partner-hdi": "CONFORT 1.6 HDI 92",
  };

  // Buscar por ID del plan
  if (mapeoVersiones[plan.id]) {
    return mapeoVersiones[plan.id];
  }

  // Buscar versión en los nombres de modelos del plan
  for (const nombreModelo of modelosPlan) {
    for (const version of modeloData.versiones) {
      const versionNombre = version.nombre.toLowerCase();
      const versionNombreCorto = version.nombreCorto.toLowerCase();

      if (
        nombreModelo.includes(versionNombre) ||
        nombreModelo.includes(versionNombreCorto)
      ) {
        return version.nombreCorto || version.nombre;
      }
    }
  }

  return "";
};

/**
 * ModeloPlanes - Componente genérico para mostrar planes de financiación de un modelo
 * 
 * Reemplaza ScrollParallaxTransition208 y ScrollParallaxTransition2008
 * Funciona para cualquier modelo que tenga planes: 208, 2008, partner, expert
 * 
 * @param {Object} props
 * @param {string} props.modeloSlug - Slug del modelo (ej: '208', '2008', 'partner', 'expert')
 */
const ModeloPlanes = ({ modeloSlug }) => {
  const modelo = getModelo(modeloSlug);
  if (!modelo) return null;

  // Obtener planes para este modelo
  const planes = useMemo(() => getPlanesPorModelo(modeloSlug), [modeloSlug]);
  
  // Si no hay planes, no renderizar nada
  if (!planes || planes.length === 0) return null;

  const modeloDisplay = modelo.nombre.charAt(0).toUpperCase() + modelo.nombre.slice(1);
  const scrollContainerRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar si se puede scrollear
  const checkScrollability = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px de tolerancia
  }, []);

  // Indicador por ÍTEM (no por página)
  const itemCount = planes?.length || 0;
  const [activeItem, setActiveItem] = useState(0);
  const checkActiveItem = useCallback(() => {
    if (!scrollContainerRef.current) return;
    setActiveItem(getClosestChildIndex(scrollContainerRef.current));
  }, []);

  React.useEffect(() => {
    checkScrollability();
    checkActiveItem();
    const container = scrollContainerRef.current;
    if (container) {
      // ✅ OPTIMIZADO: requestAnimationFrame para scroll
      let rafId = null;
      const onScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          checkScrollability();
          checkActiveItem();
          rafId = null;
        });
      };
      
      // ✅ OPTIMIZADO: Debounce para resize
      let resizeTimeout = null;
      const onResize = () => {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          checkScrollability();
          checkActiveItem();
        }, 150);
      };
      
      container.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      return () => {
        container.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        if (rafId) cancelAnimationFrame(rafId);
        if (resizeTimeout) clearTimeout(resizeTimeout);
      };
    }
  }, [planes, checkScrollability, checkActiveItem]);

  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  }, []);

  // Memoizar la lista de planes para evitar re-renders innecesarios
  const planesCards = useMemo(
    () =>
      planes.map((plan) => (
        <PlanCard key={plan.id} plan={plan} modelo={modeloSlug} />
      )),
    [planes, modeloSlug]
  );

  // Callback memoizado para el click en dots del carrusel
  const handleDotClick = useCallback(
    (i) => {
      if (!scrollContainerRef.current) return;
      scrollToChildIndex(scrollContainerRef.current, i);
    },
    []
  );

  return (
    <section className={styles.modeloPlanes}>
      <div className={styles.modeloTitleContainer}>
        <h2 className={styles.modeloTitle}>
          <PeugeotIcon className={styles.modeloTitleIcon} size={48} color="#000000" />
          Planes {modeloDisplay}
        </h2>
        <Link href="/planes" className={styles.verTodosButton}>
          Ver todos
        </Link>
      </div>

      {/* Carrusel de cards */}
      <div className={styles.carouselContainer}>
        {/* Flecha izquierda */}
        {canScrollLeft && (
          <button
            className={styles.arrowButton}
            onClick={scrollLeft}
            aria-label="Anterior"
          >
            <ChevronIcon direction="left" />
          </button>
        )}

        {/* Contenedor de cards con scroll */}
        <div ref={scrollContainerRef} className={styles.carouselTrack}>
          {/* Cards de planes - Memoizado para mejor performance */}
          {planesCards}
        </div>

        {/* Flecha derecha */}
        {canScrollRight && (
          <button
            className={`${styles.arrowButton} ${styles.arrowRight}`}
            onClick={scrollRight}
            aria-label="Siguiente"
          >
            <ChevronIcon direction="right" />
          </button>
        )}
      </div>

      {/* Indicador de páginas del carrusel */}
      <div className={styles.carouselDots}>
        <CarouselDots
          count={itemCount}
          activeIndex={activeItem}
          variant="autocity"
          onDotClick={handleDotClick}
        />
      </div>
    </section>
  );
};

export default ModeloPlanes;

