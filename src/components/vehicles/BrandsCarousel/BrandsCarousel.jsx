"use client";

/**
 * BrandsCarousel - Carrusel de logos de marcas
 * 
 * Muestra las marcas disponibles en un carrusel horizontal
 * con logos seleccionables.
 * 
 * ✅ ACTUALIZADO: Integrado con sistema de filtros
 * - Recibe selectedBrands desde URL (fuente de verdad)
 * - Emite onBrandSelect cuando se selecciona una marca
 * - Estado visual basado en selectedBrands (no estado interno)
 * 
 * @author Indiana Peugeot
 * @version 2.1.0 - Migración desde React
 */

import { useRef, memo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { BRAND_LOGOS } from "../../../config/brandLogos";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import styles from "./BrandsCarousel.module.css";

const BrandsCarouselComponent = ({
  selectedBrands = [],
  onBrandSelect,
  isFiltersVisible = false,
}) => {
  // Obtener solo las marcas que tienen logos reales (no el logo genérico)
  // Excluir logos de Indiana y Peugeot vintage del carrusel
  const brands = Object.values(BRAND_LOGOS).filter(
    (brand) =>
      !brand.src.includes("logo-negro.webp") &&
      !brand.alt.includes("Indiana") &&
      !brand.alt.includes("Peugeot Vintage")
  );

  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMountedRef = useRef(true);

  // ✅ Función para verificar estado de scroll
  const checkScrollButtons = useCallback(() => {
    if (!isMountedRef.current) return;
    const carousel = scrollContainerRef.current;
    if (!carousel) return;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    if (isMountedRef.current) {
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  // ✅ Efecto para detectar scroll y resize
  useEffect(() => {
    isMountedRef.current = true;
    const carousel = scrollContainerRef.current;
    if (!carousel) return;

    // Verificar estado inicial después de un pequeño delay para asegurar que el DOM esté listo
    const initialCheck = setTimeout(() => {
      if (isMountedRef.current) {
        checkScrollButtons();
      }
    }, 100);

    let rafId = null;
    const onScroll = () => {
      if (!isMountedRef.current || rafId) return;
      rafId = requestAnimationFrame(() => {
        if (isMountedRef.current) {
          checkScrollButtons();
        }
        rafId = null;
      });
    };

    let resizeTimeout = null;
    const onResize = () => {
      if (!isMountedRef.current) return;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          checkScrollButtons();
        }
      }, 150);
    };

    carousel.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialCheck);
      carousel.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }
    };
  }, [checkScrollButtons]);

  // ✅ Funciones de scroll
  const scrollLeft = useCallback(() => {
    const carousel = scrollContainerRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: -400, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    const carousel = scrollContainerRef.current;
    if (!carousel) return;
    carousel.scrollBy({ left: 400, behavior: "smooth" });
  }, []);

  // ✅ ACTUALIZADO: Obtener nombre de marca desde alt (ej: "Logo Toyota" → "Toyota")
  const getBrandName = (brand) => {
    return brand.alt.replace("Logo ", "");
  };

  // ✅ ACTUALIZADO: Verificar si una marca está seleccionada
  const isBrandSelected = (brandName) => {
    return selectedBrands.includes(brandName);
  };

  // ✅ ACTUALIZADO: Handler que pasa el nombre de la marca (no el objeto brand)
  const handleBrandClick = (brand) => {
    if (onBrandSelect) {
      const brandName = getBrandName(brand);
      onBrandSelect(brandName);
    }
  };

  // ✅ Detectar si hay alguna marca seleccionada (para aplicar estilos globales)
  const hasSelectedBrand = selectedBrands.length > 0;

  return (
    <div
      className={`${styles.carouselContainer} ${
        hasSelectedBrand ? styles.hasSelection : ""
      }`}
    >
      {/* Flecha izquierda - Solo en desktop */}
      {canScrollLeft && (
        <button
          className={styles.arrowButton}
          onClick={scrollLeft}
          aria-label="Anterior"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      {/* Contenedor de logos con scroll */}
      <div ref={scrollContainerRef} className={styles.carouselTrack}>
        {brands.map((brand, index) => {
          // Obtener el nombre de la marca desde el alt text
          const brandName = getBrandName(brand);
          const isSelected = isBrandSelected(brandName);
          // Detectar el tamaño del logo desde la configuración
          const isSmallLogo = brand.size === "small";
          const isLargeLogo = brand.size === "large";
          const isFord = brandName.toLowerCase() === "ford";
          return (
            <div
              key={index}
              className={`${styles.brandItem} ${
                isSelected ? styles.brandItemSelected : ""
              }`}
              onClick={() => handleBrandClick(brand)}
            >
              <Image
                src={brand.src}
                alt={brand.alt}
                width={160}
                height={80}
                className={`${styles.brandLogo} ${
                  isSelected ? styles.brandLogoSelected : ""
                } ${isSmallLogo ? styles.brandLogoSmall : ""} ${
                  isLargeLogo && !isFord ? styles.brandLogoLarge : ""
                } ${isFord ? styles.brandLogoFord : ""}`}
                loading="lazy"
              />
              {/* ✅ Tilde verde cuando está seleccionado */}
              {isSelected && (
                <div className={styles.checkmark}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="10" fill="#10b981" />
                    <path
                      d="M8 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Flecha derecha - Solo en desktop */}
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
  );
};

// ✅ OPTIMIZADO: Memoizar componente con comparación personalizada mejorada
const BrandsCarousel = memo(BrandsCarouselComponent, (prevProps, nextProps) => {
  // ✅ Comparación rápida: si las referencias son iguales, no re-renderizar
  if (prevProps.selectedBrands === nextProps.selectedBrands &&
      prevProps.onBrandSelect === nextProps.onBrandSelect &&
      prevProps.isFiltersVisible === nextProps.isFiltersVisible) {
    return true;
  }

  // Comparar selectedBrands por contenido (solo si las referencias difieren)
  const prevBrands = prevProps.selectedBrands || [];
  const nextBrands = nextProps.selectedBrands || [];

  if (prevBrands.length !== nextBrands.length) return false;

  // ✅ Optimización: Comparación rápida con Set (O(n) en lugar de O(n²))
  const prevSet = new Set(prevBrands);
  const nextSet = new Set(nextBrands);

  if (prevSet.size !== nextSet.size) return false;

  // Verificar que todos los elementos de prevBrands estén en nextBrands
  for (const brand of prevBrands) {
    if (!nextSet.has(brand)) return false;
  }

  // Comparar onBrandSelect por referencia (ya está memoizado en el padre)
  if (prevProps.onBrandSelect !== nextProps.onBrandSelect) return false;

  // Comparar isFiltersVisible (aunque ya no se pasa, por compatibilidad)
  if (prevProps.isFiltersVisible !== nextProps.isFiltersVisible) return false;

  // Props son iguales, no re-renderizar
  return true;
});

BrandsCarousel.displayName = "BrandsCarousel";

export default BrandsCarousel;

