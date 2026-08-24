"use client";

/**
 * UsadosCarousel - Carrusel horizontal de vehículos usados para la página principal
 *
 * Muestra 8 vehículos en un carrusel horizontal.
 * Diseñado mobile-first para excelente UX en dispositivos móviles.
 *
 * Características:
 * - Scroll horizontal suave con snap points
 * - Cards usando CardSimilar
 * - Mobile-first responsive design
 * - Skeleton loading states
 * - Manejo de estados vacíos
 * - Desktop: flechas absolutas a los lados, trazo fino (sin caja alrededor del carrusel)
 *
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import React, {
  useMemo,
  useRef,
  useCallback,
  useState,
  useEffect,
} from "react";
import { CardSimilar } from "../vehicles/Card/CardSimilar/CardSimilar";
import styles from "./UsadosCarousel.module.css";

/** Chevron mínimo (misma idea que marcas en /usados/vehiculos) */
function CarouselNudge({ direction }) {
  const left = direction === "left";
  return (
    <svg
      className={styles.carouselNudgeSvg}
      width="8"
      height="14"
      viewBox="0 0 8 14"
      aria-hidden
    >
      <path
        d={left ? "M6.5 1 L1.5 7 L6.5 13" : "M1.5 1 L6.5 7 L1.5 13"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Skeleton card para loading state
 */
const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonBody}>
      <div className={styles.skeletonContainer1}>
        <div className={styles.skeletonRow1}>
          <div className={styles.skeletonMarca} />
          <div className={styles.skeletonSeparator} />
          <div className={styles.skeletonModelo} />
        </div>
        <div className={styles.skeletonRow3}>
          <div className={styles.skeletonDataItem}>
            <div className={styles.skeletonDataLabel} />
            <div className={styles.skeletonDataValue} />
          </div>
          <div className={styles.skeletonDataItem}>
            <div className={styles.skeletonDataLabel} />
            <div className={styles.skeletonDataValue} />
          </div>
          <div className={styles.skeletonDataItem}>
            <div className={styles.skeletonDataLabel} />
            <div className={styles.skeletonDataValue} />
          </div>
        </div>
      </div>
      <div className={styles.skeletonPriceContainer}>
        <div className={styles.skeletonPriceLabel} />
        <div className={styles.skeletonPriceValue} />
      </div>
    </div>
  </div>
);

/**
 * Componente principal del carrusel
 * @param {boolean} homeDesktopFourColumns - Solo inicio desktop: cards un poco más angostas para mostrar 4 a la vez
 * @param {boolean} flushLeadingEdge - Alinea el inicio del scroll con el borde del contenedor (p. ej. /usados con título arriba)
 * @param {string} trackingLocation - LOCATIONS enum inyectado por el padre para select_item
 * @param {string} trackingListName - ITEM_LIST enum inyectado por el padre para select_item
 */
export const UsadosCarousel = ({
  vehicles = [],

  homeDesktopFourColumns = false,
  flushLeadingEdge = false,
  trackingLocation,
  trackingListName,
}) => {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasUserScrolled = useRef(false); // ✅ Rastrea si el usuario ha interactuado con el scroll
  const isMountedRef = useRef(true);

  // ✅ Función para actualizar el estado de las flechas
  const updateArrowVisibility = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || !isMountedRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;

    // ✅ Flecha izquierda: SOLO si el usuario ha interactuado explícitamente Y hay scroll
    // Desaparece cuando vuelve al inicio (incluyendo padding, umbral de 30px)
    setCanScrollLeft(hasUserScrolled.current && scrollLeft > 30);
    // ✅ Flecha derecha si hay más contenido
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Desplazar a una card puntual al tocar un dot
  const scrollToIndex = useCallback((index) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cards = carousel.querySelectorAll(`.${styles.cardWrapper}`);
    const card = cards[index];
    if (!(card instanceof HTMLElement)) return;
    hasUserScrolled.current = true;
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, []);

  // Índice activo de los dots: card cuyo centro está más cerca del centro del viewport.
  // Se usa como handler del prop onScroll del contenedor (React lo re-conecta al
  // nodo correcto en cada render, incluso si el carrusel se re-monta al cambiar
  // viewportClip), evitando el listener "pegado a un nodo viejo".
  const updateActiveIndex = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cards = carousel.querySelectorAll(`.${styles.cardWrapper}`);
    if (!cards.length) return;
    const viewportCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    let closest = 0;
    let closestDist = Number.POSITIVE_INFINITY;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, []);

  // Versión estrangulada por frame para el evento de scroll.
  //
  // updateActiveIndex hace querySelectorAll + lecturas de offsetLeft y
  // clientWidth sobre todas las tarjetas: eso fuerza al navegador a recalcular
  // layout. Colgado directo del onScroll corría en cada evento (decenas por
  // swipe), provocando layout thrashing en teléfonos de gama baja.
  //
  // Es el mismo patrón que ya usa el otro handler de scroll de este archivo.
  const rafIdRef = useRef(null);
  const onScrollThrottled = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      updateActiveIndex();
      rafIdRef.current = null;
    });
  }, [updateActiveIndex]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // Alinear el indicador al estado inicial y cuando llegan los vehículos (async).
  useEffect(() => {
    updateActiveIndex();
  }, [vehicles.length, updateActiveIndex]);

  // ✅ Efecto para resetear scroll al inicio cuando cambian los vehículos
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // ✅ Resetear scroll exactamente a 0 y resetear el estado de scroll
    carousel.scrollLeft = 0;
    hasUserScrolled.current = false; // ✅ Resetear el rastreo de scroll
    queueMicrotask(() => {
      setCanScrollLeft(false);
    });

    // ✅ Múltiples verificaciones para asegurar que el scroll esté en 0
    requestAnimationFrame(() => {
      if (carousel.scrollLeft !== 0) {
        carousel.scrollLeft = 0;
      }
      // Verificar nuevamente después de un frame más
      requestAnimationFrame(() => {
        if (carousel.scrollLeft !== 0) {
          carousel.scrollLeft = 0;
        }
        updateArrowVisibility();
      });
    });
  }, [vehicles, updateArrowVisibility]);

  // ✅ Efecto para detectar scroll y resize
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    isMountedRef.current = true;
    // ✅ Asegurar que el scroll esté en 0 al montar y resetear el rastreo
    carousel.scrollLeft = 0;
    hasUserScrolled.current = false;
    queueMicrotask(() => {
      setCanScrollLeft(false);
    });

    // ✅ Verificar múltiples veces que el scroll esté en 0
    requestAnimationFrame(() => {
      if (carousel.scrollLeft !== 0) {
        carousel.scrollLeft = 0;
      }
      requestAnimationFrame(() => {
        if (carousel.scrollLeft !== 0) {
          carousel.scrollLeft = 0;
        }
        updateArrowVisibility();
      });
    });

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        // ✅ Solo marcar como scrolleado si el usuario scrolleó manualmente (no por código)
        // Si el scrollLeft es mayor a un umbral razonable, asumimos que fue el usuario
        const { scrollLeft } = carousel;
        if (scrollLeft > 20) {
          hasUserScrolled.current = true;
        }
        updateArrowVisibility();
        rafId = null;
      });
    };

    carousel.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      isMountedRef.current = false;
      carousel.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
    // `vehicles.length` en deps: los vehículos se cargan async (home/usados);
    // sin esto el efecto corre con el carrusel aún sin montar y el listener de
    // scroll nunca se adjunta (flechas y dots no se actualizan al deslizar).
  }, [updateArrowVisibility, vehicles.length]);

  // ✅ Funciones de scroll
  const scrollLeft = useCallback(() => {
    if (carouselRef.current) {
      // ✅ Desplazamiento fijo: 1400px hacia la izquierda
      const currentScroll = carouselRef.current.scrollLeft;
      const newScroll = Math.max(0, currentScroll - 1400);
      carouselRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (carouselRef.current) {
      // ✅ Marcar que el usuario ha scrolleado INMEDIATAMENTE
      hasUserScrolled.current = true;

      // ✅ Desplazamiento fijo: 1400px hacia la derecha
      const currentScroll = carouselRef.current.scrollLeft;
      const maxScroll =
        carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
      const newScroll = Math.min(maxScroll, currentScroll + 1400);
      carouselRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });

      // ✅ Actualizar visibilidad inmediatamente después de marcar
      requestAnimationFrame(() => {
        updateArrowVisibility();
      });
    }
  }, [updateArrowVisibility]);

  // ✅ No mostrar si no hay vehículos
  const shouldShow = useMemo(() => {
    return vehicles && vehicles.length > 0;
  }, [vehicles]);

  if (!shouldShow) {
    return null;
  }

  const carouselContent = (
    <div
      ref={carouselRef}
      className={styles.carouselContainer}
      onScroll={onScrollThrottled}
    >
      <>
        <div className={styles.carouselLeadSpacer} aria-hidden />
        {vehicles.map((vehicle, index) => (
          <div key={vehicle.id || vehicle._id} className={styles.cardWrapper}>
            <CardSimilar
              auto={vehicle}
              isPriority={index < 2}
              usadosCarousel
              trackingLocation={trackingLocation}
              trackingListName={trackingListName}
              index={index}
            />
          </div>
        ))}
        <div className={styles.carouselLeadSpacer} aria-hidden />
      </>
    </div>
  );

  const carouselInner = (
    <div className={styles.carouselFrame}>
      <div className={styles.carouselTrack}>{carouselContent}</div>
      {canScrollLeft && (
        <button
          type="button"
          className={styles.carouselArrowPrev}
          onClick={scrollLeft}
          aria-label="Desplazar hacia la izquierda"
        >
          <CarouselNudge direction="left" />
        </button>
      )}
      <button
        type="button"
        className={`${styles.carouselArrowNext} ${!canScrollRight ? styles.carouselArrowDisabled : ""}`}
        onClick={scrollRight}
        aria-label="Desplazar hacia la derecha"
        disabled={!canScrollRight}
      >
        <CarouselNudge direction="right" />
      </button>
    </div>
  );

  // Indicador de posición (dots). Visible en mobile, donde no hay flechas.
  const dots =
    vehicles.length > 1 ? (
      <div
        className={styles.dots}
        role="tablist"
        aria-label="Indicador del carrusel de usados"
      >
        {vehicles.map((vehicle, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={`${vehicle.id || vehicle._id || i}-dot`}
              type="button"
              className={`${styles.dot} ${isActive ? styles.dotActive : ""}`}
              onClick={() => scrollToIndex(i)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Ir al vehículo ${i + 1} de ${vehicles.length}`}
              aria-current={isActive ? "true" : "false"}
              tabIndex={isActive ? 0 : -1}
            />
          );
        })}
      </div>
    ) : null;

  const carouselWithDots = (
    <>
      {carouselInner}
      {dots}
    </>
  );

  const wrapperClassName = [
    styles.carouselWrapper,
    styles.carouselCompact,
    styles.carouselViewportClip,
    homeDesktopFourColumns ? styles.carouselHomeDesktopFour : "",
    flushLeadingEdge ? styles.carouselFlushLeading : "",
  ]
    .filter(Boolean)
    .join(" ");

  // El envoltorio y las clases van siempre: de 768px para arriba el CSS las
  // deja sin efecto. Antes esto lo decidía el JavaScript preguntando el ancho
  // de pantalla, y como el servidor no puede medirla, el primer render salía
  // con el diseño de escritorio y en celular se veía saltar.
  return (
    <div className={styles.viewportClip}>
      <div className={wrapperClassName}>{carouselWithDots}</div>
    </div>
  );
};

export default UsadosCarousel;
