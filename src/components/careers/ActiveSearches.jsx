"use client";

/**
 * ActiveSearches - Sección de búsquedas activas
 * Desktop: grid de cards | Mobile: carrusel horizontal con dots
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { activeSearches } from "@/lib/careers.data";
import JobCard from "./JobCard";
import { CarouselDots } from "../ui/CarouselDots/CarouselDots";
import { ChevronIcon } from "../ui/icons/ChevronIcon";
import { getClosestChildIndex, scrollToChildIndex } from "@/utils/carouselActiveIndex";
import styles from "./ActiveSearches.module.css";

export default function ActiveSearches() {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    setActiveIndex(getClosestChildIndex(el));
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        checkScroll();
        raf = null;
      });
    };
    const onResize = () => setTimeout(checkScroll, 100);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [checkScroll]);

  const handleDotClick = useCallback((i) => {
    if (scrollRef.current) scrollToChildIndex(scrollRef.current, i);
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="active-searches-heading"
    >
      <div className={styles.container}>
        <h2 id="active-searches-heading" className={styles.heading}>
          Búsquedas Activas
        </h2>

        {/* Desktop: grid */}
        <div className={styles.desktopGrid}>
          {activeSearches.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>

        {/* Mobile: carrusel */}
        <div className={styles.mobileCarousel}>
          <div className={styles.carouselWrapper}>
            {canScrollLeft && (
              <button
                type="button"
                className={styles.arrowButton}
                onClick={scrollLeft}
                aria-label="Anterior"
              >
                <ChevronIcon direction="left" size={24} />
              </button>
            )}
            <div
              ref={scrollRef}
              className={styles.carouselTrack}
              role="region"
              aria-label="Carrusel de búsquedas activas"
            >
              {activeSearches.map((job) => (
                <div key={job.id} className={styles.carouselCard}>
                  <JobCard {...job} />
                </div>
              ))}
            </div>
            {canScrollRight && (
              <button
                type="button"
                className={`${styles.arrowButton} ${styles.arrowRight}`}
                onClick={scrollRight}
                aria-label="Siguiente"
              >
                <ChevronIcon direction="right" size={24} />
              </button>
            )}
          </div>
          <div className={styles.carouselDots}>
            <CarouselDots
              count={activeSearches.length}
              activeIndex={activeIndex}
              variant="autocity"
              onDotClick={handleDotClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
