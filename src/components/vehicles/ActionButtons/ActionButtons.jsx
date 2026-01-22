"use client";

/**
 * ActionButtons - Componente reutilizable para botones de acción (Filtrar/Ordenar)
 * 
 * ✅ PROPÓSITO: Eliminar duplicación de código entre mobile y desktop
 * ✅ USO: Renderizar en mobile y desktop con diferentes className
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { memo } from "react";
import { FilterIcon } from "../../ui/icons/FilterIcon";
import { SortIcon } from "../../ui/icons/SortIcon";
import SortDropdown from "../Filters/SortDropdown";
import styles from "./ActionButtons.module.css";

/**
 * Componente ActionButtons
 * @param {Object} props
 * @param {Function} props.onFilterClick - Handler para click en botón Filtrar
 * @param {Function} props.onSortClick - Handler para click en botón Ordenar
 * @param {Function} props.onSortChange - Handler para cambio de sorting
 * @param {Function} props.onCloseSortDropdown - Handler para cerrar dropdown
 * @param {string|null} props.selectedSort - Sorting seleccionado actual
 * @param {boolean} props.isSortDisabled - Si el sorting está deshabilitado
 * @param {boolean} props.isSortDropdownOpen - Si el dropdown está abierto
 * @param {Object} props.sortButtonRef - Ref para el botón de sorting
 * @param {string} props.className - Clase CSS adicional para el contenedor
 */
export const ActionButtons = memo(({
  onFilterClick,
  onSortClick,
  onSortChange,
  onCloseSortDropdown,
  selectedSort,
  isSortDisabled,
  isSortDropdownOpen,
  sortButtonRef,
  className = "",
}) => {
  return (
    <div className={`${styles.actionButtons} ${className}`}>
      <button
        className={styles.actionButton}
        onClick={onFilterClick}
        type="button"
        aria-label="Abrir filtros"
      >
        <FilterIcon size={16} />
        <span>Filtrar</span>
      </button>

      <div style={{ position: "relative" }}>
        <button
          ref={sortButtonRef}
          className={`${styles.actionButton} ${selectedSort ? styles.active : ""}`}
          onClick={onSortClick}
          disabled={isSortDisabled}
          type="button"
          aria-label="Ordenar vehículos"
          aria-expanded={isSortDropdownOpen}
        >
          <SortIcon size={16} />
          <span>Ordenar</span>
        </button>

        {isSortDropdownOpen && (
          <SortDropdown
            isOpen={isSortDropdownOpen}
            selectedSort={selectedSort}
            onSortChange={onSortChange}
            onClose={onCloseSortDropdown}
            disabled={isSortDisabled}
            triggerRef={sortButtonRef}
          />
        )}
      </div>
    </div>
  );
});

ActionButtons.displayName = "ActionButtons";

export default ActionButtons;

