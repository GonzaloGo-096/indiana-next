"use client";

import { useCallback } from "react";
import styles from "./ColorSelector.module.css";

/**
 * ColorSelector - Selector de colores para modelos 0km
 * 
 * @param {Object} props
 * @param {Array} props.colores - Array de objetos color { key, label, hex, url }
 * @param {string} props.colorActivo - Key del color activo
 * @param {Function} props.onColorChange - Callback al cambiar color
 * @param {string} props.size - Tamaño: 'sm' | 'md' | 'lg'
 */
export function ColorSelector({
  colores = [],
  colorActivo,
  onColorChange,
  size = "md",
}) {
  if (!colores.length) return null;

  // Navegación por teclado: Arrow keys para cambiar entre colores
  const handleKeyDown = useCallback(
    (e, currentIndex) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : colores.length - 1;
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = currentIndex < colores.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = colores.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex && colores[newIndex]) {
        onColorChange(colores[newIndex].key);
      }
    },
    [colores, onColorChange]
  );

  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="Selector de color"
    >
      {colores.map((color, index) => {
        const isActive = color.key === colorActivo;
        const hasImage = !!color.url;

        return (
          <button
            key={color.key}
            type="button"
            className={`${styles.colorButton} ${styles[size]} ${
              isActive ? styles.active : ""
            } ${!hasImage ? styles.noImage : ""}`}
            onClick={() => onColorChange(color.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            aria-checked={isActive}
            aria-label={`${color.label}${!hasImage ? " (imagen no disponible)" : ""}`}
            role="radio"
            title={color.label}
            tabIndex={isActive ? 0 : -1}
          >
            <span
              className={styles.colorCircle}
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            {!hasImage && <span className={styles.noImageIndicator} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

