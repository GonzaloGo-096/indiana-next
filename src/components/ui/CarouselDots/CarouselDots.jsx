/**
 * CarouselDots - Indicador de carrusel con dots discretos
 * - Reutilizable en cualquier carrusel por scroll
 * - count: cantidad de páginas (no elementos)
 * - activeIndex: índice activo actual
 * - onDotClick?: callback opcional para desplazar a una página
 */
import React from "react";
import styles from "./CarouselDots.module.css";

export const CarouselDots = ({
  count = 0,
  activeIndex = 0,
  onDotClick = null,
  variant = "pill",
}) => {
  if (!count || count <= 1) return null;
  // Variante especial: 'comet' usa progress continuo en vez de índices discretos
  if (variant === "comet") {
    // Espera prop adicional 'progress' vía style var --progress
    // Consumida desde style prop en el contenedor
    const progress =
      typeof activeIndex === "number" ? Math.max(0, Math.min(1, activeIndex)) : 0;
    return (
      <div
        className={styles.rail}
        style={{ "--progress": progress }}
        aria-hidden="true"
      >
        <div className={styles.cometGroup}>
          <span className={`${styles.seg} ${styles.segBlueSm}`} />
          <span className={`${styles.seg} ${styles.segWhiteMd}`} />
          <span className={`${styles.seg} ${styles.segBlueSm2}`} />
          <span className={`${styles.seg} ${styles.segWhiteMd2}`} />
        </div>
      </div>
    );
  }
  const indices = Array.from({ length: count }, (_, i) => i);
  return (
    <div className={styles.dots} role="tablist" aria-label="Indicador de carrusel">
      {/* Marcador gris sutil al inicio y al final (solo variante autocity) */}
      {variant === "autocity" && (
        <span className={styles.edgeMarker} aria-hidden="true" />
      )}
      {indices.map((i) => {
        const isActive = i === activeIndex;
        let baseClass = styles.dot;
        let activeClass = styles.dotActive;
        if (variant === "microDash") {
          baseClass = styles.dotDash;
          activeClass = styles.dotDashActive;
        } else if (variant === "ios") {
          baseClass = styles.dotIos;
          activeClass = styles.dotIosActive;
        } else if (variant === "md3") {
          baseClass = styles.dotMd3;
          activeClass = styles.dotMd3Active;
        } else if (variant === "autocity") {
          baseClass = styles.dotAuto;
          activeClass = styles.dotAutoActive;
        }
        const className = [baseClass, isActive ? activeClass : "", onDotClick ? styles.clickable : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={i}
            type="button"
            className={className}
            role="tab"
            aria-selected={isActive}
            aria-label={`Ir a la página ${i + 1} de ${count}`}
            onClick={onDotClick ? () => onDotClick(i) : undefined}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(e) => {
              if (onDotClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onDotClick(i);
              }
            }}
          />
        );
      })}
      {variant === "autocity" && (
        <span className={styles.edgeMarker} aria-hidden="true" />
      )}
    </div>
  );
};

export default CarouselDots;

