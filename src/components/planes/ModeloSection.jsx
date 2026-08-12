"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getModelo, COLORES } from "@/data/modelos";
import { PlanCard } from "./PlanCard";
import { CarouselDots } from "../ui/CarouselDots/CarouselDots";
import { PeugeotIcon } from "../ui/icons/PeugeotIcon";
import { getClosestChildIndex, scrollToChildIndex } from "@/utils/carouselActiveIndex";
import cta from "../home/HomeSectionCtas.module.css";
import kmStyles from "@/app/(site)/0km/0km.module.css";
import styles from "./ModeloSection.module.css";

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
 * Obtener una sola foto del modelo (de sus colores disponibles)
 * Para usar como primer elemento del carrusel
 * @param {string} modeloSlug - Slug del modelo
 * @returns {Array} - Array con un solo objeto { url, alt } (o vacío)
 */
const obtenerFotoColorModelo = (modeloSlug) => {
  const modelo = getModelo(modeloSlug);
  if (!modelo || !modelo.versiones?.length) {
    if (modelo?.imagenPrincipal?.url) {
      return [{ url: modelo.imagenPrincipal.url, alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}` }];
    }
    return [];
  }

  const coloresSet = new Set();
  modelo.versiones.forEach((v) => {
    v.coloresPermitidos?.forEach((key) => coloresSet.add(key));
  });

  const coloresArray = Array.from(coloresSet)
    .map((key) => COLORES[key])
    .filter((c) => c?.url);

  if (coloresArray.length === 0 && modelo.imagenPrincipal?.url) {
    return [{ url: modelo.imagenPrincipal.url, alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}` }];
  }

  // Solo una foto: el primer color disponible
  const color = coloresArray[0];
  return color ? [{ url: color.url, alt: `Peugeot ${modelo.nombre} ${color.label}` }] : [];
};

/**
 * Componente para mostrar planes de un modelo específico en un carrusel
 */
export const ModeloSection = ({ modelo, planes }) => {
  const modeloDisplay = modelo.charAt(0).toUpperCase() + modelo.slice(1);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Una foto del auto (de colores) como primer elemento del carrusel
  const fotosColores = useMemo(() => obtenerFotoColorModelo(modelo), [modelo]);

  const fotosCards = useMemo(
    () =>
      fotosColores.map((foto, i) => (
        <div key={`foto-${modelo}-${i}`} className={styles.modeloImageCard} data-modelo={modelo}>
          <Image
            src={foto.url}
            alt={foto.alt}
            width={580}
            height={400}
            className={styles.modeloImage}
            sizes="(max-width: 768px) 380px, 500px"
          />
          <div className={styles.modeloImageButtonContainer}>
            <Link
              href={`/0km/${modelo}`}
              className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline} ${styles.modeloImageButton}`}
            >
              Ver modelo
            </Link>
          </div>
        </div>
      )),
    [fotosColores, modelo]
  );

  // Cards de planes
  const planesCards = useMemo(
    () =>
      planes.map((plan) => (
        <PlanCard key={plan.id} plan={plan} modelo={modelo} />
      )),
    [planes, modelo]
  );

  // Callback memoizado para el click en dots del carrusel
  const handleDotClick = useCallback(
    (i) => {
      if (!scrollContainerRef.current) return;
      scrollToChildIndex(scrollContainerRef.current, i);
    },
    []
  );

  // Verificar si se puede scrollear
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px de tolerancia
  };

  // Indicador por ítem (fotos + planes)
  const itemCount = (fotosColores?.length || 0) + (planes?.length || 0);
  const [activeItem, setActiveItem] = useState(0);
  const checkActiveItem = () => {
    if (!scrollContainerRef.current) return;
    setActiveItem(getClosestChildIndex(scrollContainerRef.current));
  };

  useEffect(() => {
    checkScrollability();
    checkActiveItem();
    const container = scrollContainerRef.current;
    if (container) {
      // Arrancar siempre en el primer elemento (foto del modelo). Con snap
      // centrado en mobile, queda centrado al cargar. rAF para ganarle a la
      // restauración de scroll del navegador.
      container.scrollLeft = 0;
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
      });

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
  }, [planes, fotosColores]);

  const scrollByPage = useCallback((direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = Math.max(320, Math.round(el.clientWidth * 0.55));
    el.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  }, []);

  const scrollLeft = useCallback(() => scrollByPage(-1), [scrollByPage]);
  const scrollRight = useCallback(() => scrollByPage(1), [scrollByPage]);

  // En desktop, 208 (3 planes) es el único que necesita carrusel;
  // el resto cabe en pantalla y se muestra completo.
  const desktopGrid = planes.length <= 2;

  return (
    <section className={`${styles.modeloSection} ${desktopGrid ? styles.desktopGrid : ""} min-w-0 w-full`}>
      <h2 className={styles.modeloTitle}>
        <PeugeotIcon className={styles.modeloTitleIcon} size={48} color="#000000" />
        Planes {modeloDisplay}
      </h2>

      <section
        className={`${kmStyles.carouselSection} ${styles.planesCarouselSection}`}
        aria-label={`Planes ${modeloDisplay}`}
      >
        <div className={`${kmStyles.carouselWrapper} ${styles.carouselWrapperInPlanes}`}>
          <button
            type="button"
            className={`${kmStyles.scrollButton} ${kmStyles.scrollButtonLeft} ${styles.carouselScrollBtn}`}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Anterior"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            ref={scrollContainerRef}
            className={`${kmStyles.carousel} ${styles.carouselTrack}`}
          >
            {fotosCards}
            {planesCards}
          </div>

          <button
            type="button"
            className={`${kmStyles.scrollButton} ${kmStyles.scrollButtonRight} ${styles.carouselScrollBtn}`}
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Siguiente"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </section>

      {/* Indicador de páginas del carrusel */}
      <div className={styles.carouselDots}>
        <CarouselDots
          count={itemCount}
          activeIndex={activeItem}
          variant="pill"
          onDotClick={handleDotClick}
        />
      </div>
    </section>
  );
};

