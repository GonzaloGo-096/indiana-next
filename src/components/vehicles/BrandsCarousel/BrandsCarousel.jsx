"use client";

/**
 * BrandsCarousel - Carrusel de logos de marcas
 *
 * En /usados/vehiculos las flechas viven en VehiculosClient (fuera de este contenedor).
 */

import {
  useRef,
  memo,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import Image from "next/image";
import { BRAND_LOGOS } from "@/config/brandLogos";
import styles from "./BrandsCarousel.module.css";

const CAROUSEL_ORDER = [
  "peugeot",
  "fiat",
  "audi",
  "renault",
  "toyota",
  "citroen",
  "chevrolet",
  "bmw",
  "jeep",
  "hyundai",
  "mercedesbenz",
  "ford",
  "nissan",
  "honda",
  "volkswagen",
];

const filterBrand = (brand) =>
  brand &&
  !brand.src.includes("logo-negro.webp") &&
  !brand.alt.includes("Indiana") &&
  !brand.alt.includes("Peugeot Vintage");

const BRANDS_FOR_CAROUSEL = CAROUSEL_ORDER.filter((key) => {
  const brand = BRAND_LOGOS[key];
  return brand && filterBrand(brand);
}).map((key) => BRAND_LOGOS[key]);

const BrandsCarouselInner = forwardRef(function BrandsCarouselInner(
  {
    selectedBrands = [],
    onBrandSelect,
    isFiltersVisible = false,
    embedded = false,
    onScrollabilityChange,
  },
  ref
) {
  const brands = BRANDS_FOR_CAROUSEL;

  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isMountedRef = useRef(true);

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

  useImperativeHandle(
    ref,
    () => ({
      scrollPrev: () => {
        scrollContainerRef.current?.scrollBy({ left: -400, behavior: "smooth" });
      },
      scrollNext: () => {
        scrollContainerRef.current?.scrollBy({ left: 400, behavior: "smooth" });
      },
      /** Lista usados: leer/restaurar scroll horizontal tras abrir panel de filtros */
      getTrackElement: () => scrollContainerRef.current,
    }),
    []
  );

  useEffect(() => {
    onScrollabilityChange?.({
      canScrollLeft,
      canScrollRight,
    });
  }, [canScrollLeft, canScrollRight, onScrollabilityChange]);

  useEffect(() => {
    const carousel = scrollContainerRef.current;
    if (carousel) carousel.scrollLeft = 0;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const carousel = scrollContainerRef.current;
    if (!carousel) return;

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

  const getBrandName = (brand) => {
    return brand.alt.replace("Logo ", "");
  };

  const isBrandSelected = (brandName) => {
    return selectedBrands.includes(brandName);
  };

  const handleBrandClick = (brand) => {
    if (onBrandSelect) {
      const brandName = getBrandName(brand);
      onBrandSelect(brandName);
    }
  };

  const hasSelectedBrand = selectedBrands.length > 0;

  return (
    <div
      className={`${styles.carouselContainer} ${
        embedded ? styles.carouselContainerEmbedded : ""
      } ${hasSelectedBrand ? styles.hasSelection : ""} w-full min-w-0`}
    >
      <div ref={scrollContainerRef} className={styles.carouselTrack}>
        {brands.map((brand, index) => {
          const brandName = getBrandName(brand);
          const isSelected = isBrandSelected(brandName);
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
    </div>
  );
});

BrandsCarouselInner.displayName = "BrandsCarousel";

const BrandsCarousel = memo(BrandsCarouselInner, (prevProps, nextProps) => {
  if (prevProps.embedded !== nextProps.embedded) return false;
  if (prevProps.isFiltersVisible !== nextProps.isFiltersVisible) return false;
  if (prevProps.onBrandSelect !== nextProps.onBrandSelect) return false;
  if (prevProps.onScrollabilityChange !== nextProps.onScrollabilityChange)
    return false;

  if (prevProps.selectedBrands === nextProps.selectedBrands) return true;

  const prevBrands = prevProps.selectedBrands || [];
  const nextBrands = nextProps.selectedBrands || [];
  if (prevBrands.length !== nextBrands.length) return false;

  const nextSet = new Set(nextBrands);
  for (const brand of prevBrands) {
    if (!nextSet.has(brand)) return false;
  }
  return true;
});

BrandsCarousel.displayName = "BrandsCarousel";

export default BrandsCarousel;
