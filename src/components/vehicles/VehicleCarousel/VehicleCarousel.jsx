"use client";

/**
 * VehicleCarousel - Carrusel horizontal de vehículos, sin datos propios.
 *
 * Extrae el comportamiento que estaba duplicado casi literal entre
 * SimilarVehiclesCarousel y PriceRangeCarousel (162 líneas idénticas de 290 y
 * 303): el manejo del scroll, las flechas, el reset al cambiar de vehículo, el
 * skeleton y el estado de error. Cualquier bug ahí había que arreglarlo dos
 * veces, y la segunda copia se olvidaba.
 *
 * Recibe los datos ya resueltos (cada carrusel usa su propio hook) y su propio
 * módulo de CSS. Eso último es a propósito: los dos NO son visualmente
 * idénticos —difieren en márgenes y alineación del encabezado— así que unificar
 * las hojas cambiaría el aspecto de uno de los dos. Se consolida la conducta,
 * no la presentación.
 *
 * Clases que espera del módulo recibido:
 *   section · container · header · carouselWrapper · carouselContainer
 *   cardWrapper · arrowButton · arrowButtonRight · arrowButtonDisabled
 *   errorState · skeleton*
 *
 * @author Indiana Peugeot
 */

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { CardSimilar } from "../Card/CardSimilar/CardSimilar";
import { ChevronIcon } from "@/components/ui/icons/ChevronIcon";

/** Desplazamiento por click de flecha, igual que en UsadosCarousel. */
const SCROLL_STEP = 1400;

/** Umbral para considerar que el usuario scrolleó a mano y no fue código. */
const USER_SCROLL_THRESHOLD = 20;

/** Umbral para mostrar la flecha izquierda (tolera el padding del contenedor). */
const LEFT_ARROW_THRESHOLD = 30;

function SkeletonCard({ styles }) {
  return (
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
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonDataItem}>
                <div className={styles.skeletonDataLabel} />
                <div className={styles.skeletonDataValue} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.skeletonPriceContainer}>
          <div className={styles.skeletonPriceLabel} />
          <div className={styles.skeletonPriceValue} />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {Object}   props
 * @param {Array}    props.vehicles      - Vehículos ya resueltos
 * @param {boolean}  props.isLoading
 * @param {boolean}  props.isError
 * @param {Object}   props.styles        - Módulo CSS del carrusel concreto
 * @param {string}   props.testId        - data-testid de la sección
 * @param {string}   props.errorMessage  - Texto del estado de error
 * @param {React.ReactNode} props.header - Encabezado (título) ya armado
 * @param {number}   [props.skeletonCount=3]
 */
export function VehicleCarousel({
  vehicles = [],
  isLoading = false,
  isError = false,
  styles,
  testId,
  errorMessage,
  header,
  skeletonCount = 3,
}) {
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hasUserScrolled = useRef(false);
  const isMountedRef = useRef(true);

  const updateArrowVisibility = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel || !isMountedRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    // Izquierda: solo si el usuario interactuó explícitamente Y hay scroll.
    setCanScrollLeft(hasUserScrolled.current && scrollLeft > LEFT_ARROW_THRESHOLD);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  /**
   * Vuelve el scroll al inicio. Se verifica en frames sucesivos porque el
   * navegador puede restaurar la posición después del primer intento.
   */
  const resetScroll = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollLeft = 0;
    hasUserScrolled.current = false;
    queueMicrotask(() => setCanScrollLeft(false));

    requestAnimationFrame(() => {
      if (carousel.scrollLeft !== 0) carousel.scrollLeft = 0;
      requestAnimationFrame(() => {
        if (carousel.scrollLeft !== 0) carousel.scrollLeft = 0;
        updateArrowVisibility();
      });
    });
  }, [updateArrowVisibility]);

  // Al cambiar los vehículos (se navegó a otro auto), volver al inicio.
  useEffect(() => {
    resetScroll();
  }, [vehicles, resetScroll]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    isMountedRef.current = true;
    resetScroll();

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (carousel.scrollLeft > USER_SCROLL_THRESHOLD) {
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
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [updateArrowVisibility, resetScroll]);

  const scrollLeft = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    carousel.scrollTo({
      left: Math.max(0, carousel.scrollLeft - SCROLL_STEP),
      behavior: "smooth",
    });
  }, []);

  const scrollRight = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Marcar antes de mover, para que la flecha izquierda aparezca de una.
    hasUserScrolled.current = true;

    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    carousel.scrollTo({
      left: Math.min(maxScroll, carousel.scrollLeft + SCROLL_STEP),
      behavior: "smooth",
    });

    requestAnimationFrame(updateArrowVisibility);
  }, [updateArrowVisibility]);

  // Mientras carga se muestra el skeleton; sin vehículos, la sección no existe.
  const shouldShow = useMemo(
    () => isLoading || (vehicles && vehicles.length > 0),
    [vehicles, isLoading],
  );

  if (!shouldShow) return null;

  return (
    <section className={styles.section} data-testid={testId}>
      <div className={styles.container}>
        <div className={styles.header}>{header}</div>

        <div className={styles.carouselWrapper}>
          {canScrollLeft && (
            <button
              className={styles.arrowButton}
              onClick={scrollLeft}
              aria-label="Desplazar hacia la izquierda"
              type="button"
            >
              <ChevronIcon direction="left" size={20} />
            </button>
          )}

          <div ref={carouselRef} className={styles.carouselContainer}>
            {isLoading ? (
              Array.from({ length: skeletonCount }, (_, i) => (
                <SkeletonCard key={`skeleton-${i}`} styles={styles} />
              ))
            ) : isError ? (
              <div className={styles.errorState}>
                <p>{errorMessage}</p>
              </div>
            ) : (
              vehicles.map((vehicle, index) => (
                <div key={vehicle.id || vehicle._id} className={styles.cardWrapper}>
                  <CardSimilar auto={vehicle} index={index} />
                </div>
              ))
            )}
          </div>

          <button
            className={`${styles.arrowButton} ${styles.arrowButtonRight} ${
              !canScrollRight ? styles.arrowButtonDisabled : ""
            }`}
            onClick={scrollRight}
            aria-label="Desplazar hacia la derecha"
            type="button"
            disabled={!canScrollRight}
          >
            <ChevronIcon direction="right" size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default VehicleCarousel;
