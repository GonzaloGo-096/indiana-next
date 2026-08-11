"use client";

/**
 * SortDropdown — Dropdown de ordenamiento para el listado de vehículos.
 *
 * ✅ ARQUITECTURA:
 * - Renderizado via React Portal en document.body: escapa cualquier
 *   overflow:hidden del árbol de layout (toolbarRegion, actionButtons, etc.)
 *   sin necesitar cambios en los estilos del contenedor padre.
 * - Verificación de visibilidad del trigger (offsetParent): si el botón
 *   disparador está oculto con display:none (ej. la instancia mobile cuando
 *   se usa el layout desktop), el componente retorna null y sus listeners
 *   nunca se registran — elimina el bug de doble-instancia donde el dropdown
 *   oculto cerraba el visible en mousedown antes del click.
 * - Posición fixed calculada con getBoundingClientRect(), se ajusta al
 *   alinear a la derecha si el dropdown desbordaría la viewport.
 *
 * ✅ ACCESIBILIDAD:
 * - role="menu" + role="menuitemradio" (patrón correcto para opciones
 *   mutuamente exclusivas dentro de un menú; aria-checked refleja selección).
 * - ESC cierra y devuelve foco al trigger.
 * - focus-visible visible.
 *
 * @version 2.0.0
 */

import { useEffect, useLayoutEffect, useRef, useState, memo } from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { SORT_OPTIONS } from "@/constants/filterOptions";
import { isValidSortOption } from "@/utils/filters";
import styles from "./SortDropdown.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Calcula las coordenadas viewport del dropdown a partir del rectángulo del
 * botón trigger. Si el dropdown se saldría por la derecha, lo alinea al borde
 * derecho del trigger.
 */
function computeCoords(triggerEl, minWidth = 220) {
  const rect = triggerEl.getBoundingClientRect();
  const width = Math.max(rect.width, minWidth);
  const rightEdge = rect.left + width;
  const left =
    rightEdge > window.innerWidth
      ? Math.max(0, rect.right - width)
      : rect.left;

  return {
    top: rect.bottom + 8,
    left,
    minWidth: width,
  };
}

// ─── componente ─────────────────────────────────────────────────────────────

const SortDropdown = memo(
  /**
   * @param {Object}   props
   * @param {boolean}  props.isOpen         - Controla si el dropdown está abierto.
   * @param {string|null} props.selectedSort - Valor del sort activo (null = sin orden).
   * @param {Function} props.onSortChange   - Callback al seleccionar opción (recibe el valor o null).
   * @param {Function} props.onClose        - Callback para cerrar el dropdown.
   * @param {boolean}  props.disabled       - Deshabilita todas las opciones.
   * @param {Object}   props.triggerRef     - Ref del botón que abrió el dropdown.
   */
  ({
    isOpen = false,
    selectedSort = null,
    onSortChange = () => {},
    onClose = () => {},
    disabled = false,
    triggerRef = null,
  }) => {
    const dropdownRef = useRef(null);
    const [coords, setCoords] = useState(null);

    // ── Visibility guard ──────────────────────────────────────────────────
    // Si el trigger está dentro de un contenedor display:none (ej. la instancia
    // mobile cuando está activo el layout desktop), offsetParent === null.
    // En ese caso no renderizamos nada ni registramos listeners.
    const triggerVisible =
      triggerRef?.current != null &&
      triggerRef.current.offsetParent !== null;

    // ── Posición inicial (sincrónica, antes del primer paint) ─────────────
    useLayoutEffect(() => {
      if (!isOpen || !triggerVisible) {
        setCoords(null);
        return;
      }
      setCoords(computeCoords(triggerRef.current));
    }, [isOpen, triggerVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Cerrar en scroll / resize ─────────────────────────────────────────
    useEffect(() => {
      if (!isOpen || !triggerVisible) return;
      const handleScroll = () => onClose();
      const handleResize = () => {
        if (triggerRef?.current) {
          setCoords(computeCoords(triggerRef.current));
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }, [isOpen, triggerVisible, onClose, triggerRef]);

    // ── ESC → cerrar y devolver foco ──────────────────────────────────────
    useEffect(() => {
      if (!isOpen || !triggerVisible) return;
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          onClose();
          triggerRef?.current?.focus();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, triggerVisible, onClose, triggerRef]);

    // ── Click fuera → cerrar ──────────────────────────────────────────────
    useEffect(() => {
      if (!isOpen || !triggerVisible) return;
      const handleMouseDown = (e) => {
        const onDropdown = dropdownRef.current?.contains(e.target);
        const onTrigger = triggerRef?.current?.contains(e.target);
        if (!onDropdown && !onTrigger) onClose();
      };
      document.addEventListener("mousedown", handleMouseDown);
      return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [isOpen, triggerVisible, onClose, triggerRef]);

    // ── Handlers de selección ─────────────────────────────────────────────
    const handleSelect = (value) => {
      if (disabled || !isValidSortOption(value)) return;
      onSortChange(value);
      onClose();
    };

    const handleClear = () => {
      if (disabled) return;
      onSortChange(null);
      onClose();
    };

    // ── Guard de renderizado ──────────────────────────────────────────────
    if (!isOpen || !triggerVisible || !coords) return null;

    // ── Portal ────────────────────────────────────────────────────────────
    return createPortal(
      <div
        ref={dropdownRef}
        className={styles.dropdown}
        style={{
          top: coords.top,
          left: coords.left,
          minWidth: coords.minWidth,
        }}
        role="menu"
        aria-label="Ordenar por"
      >
        {/* Sin ordenamiento */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={`${styles.option}${selectedSort === null ? ` ${styles.selected}` : ""}`}
          role="menuitemradio"
          aria-checked={selectedSort === null}
        >
          <span>Sin ordenamiento</span>
          {selectedSort === null && <CheckIcon size={14} />}
        </button>

        <div className={styles.divider} aria-hidden="true" />

        {/* Opciones de sort */}
        {SORT_OPTIONS.map((option) => {
          const isSelected = selectedSort === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={disabled}
              className={`${styles.option}${isSelected ? ` ${styles.selected}` : ""}`}
              role="menuitemradio"
              aria-checked={isSelected}
            >
              <span>{option.label}</span>
              {isSelected && <CheckIcon size={14} />}
            </button>
          );
        })}
      </div>,
      document.body
    );
  }
);

SortDropdown.displayName = "SortDropdown";
export default SortDropdown;
