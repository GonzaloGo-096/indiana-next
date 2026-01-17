"use client";

import { useCallback } from "react";
import styles from "./VersionTabs.module.css";

/**
 * VersionTabs - Tabs de versiones para desktop
 * 
 * @param {Object} props
 * @param {Array} props.versiones - Array de objetos versión
 * @param {string} props.versionActivaId - ID de la versión activa
 * @param {Function} props.onVersionChange - Callback al cambiar versión
 */
export function VersionTabs({
  versiones = [],
  versionActivaId,
  onVersionChange,
}) {
  if (!versiones.length) return null;

  // Navegación por teclado: Arrow keys para cambiar entre tabs
  const handleKeyDown = useCallback(
    (e, currentIndex) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : versiones.length - 1;
          break;
        case "ArrowRight":
          e.preventDefault();
          newIndex = currentIndex < versiones.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = versiones.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex && versiones[newIndex]) {
        onVersionChange(versiones[newIndex].id);
      }
    },
    [versiones, onVersionChange]
  );

  // Formatear nombre: GT en rojo, siglas en mayúsculas, resto capitalizado
  const renderNombre = (nombre) => {
    const formatWord = (word) => {
      const upper = word.toUpperCase();
      // Códigos alfanuméricos (T200, AM24, GT) o siglas cortas
      if (word.length <= 2 || /^[A-Z]+\d+$/i.test(word)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    };

    // Dividir por espacios, formatear cada palabra
    const palabras = nombre.split(" ");

    return palabras.map((palabra, i) => {
      const formatted = formatWord(palabra);
      const upperWord = palabra.toUpperCase();

      // Si es GT, ponerlo en rojo
      if (upperWord === "GT") {
        return (
          <span key={i}>
            {i > 0 && " "}
            <span className={styles.gtText}>{formatted}</span>
          </span>
        );
      }

      return (i > 0 ? " " : "") + formatted;
    });
  };

  return (
    <nav
      className={styles.container}
      role="tablist"
      aria-label="Versiones disponibles"
    >
      {versiones.map((version, index) => {
        const isActive = version.id === versionActivaId;
        const nombre = version.nombreCorto || version.nombre || "";

        return (
          <button
            key={version.id}
            type="button"
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
            onClick={() => onVersionChange(version.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${version.id}`}
            tabIndex={isActive ? 0 : -1}
          >
            {renderNombre(nombre)}
          </button>
        );
      })}
    </nav>
  );
}

