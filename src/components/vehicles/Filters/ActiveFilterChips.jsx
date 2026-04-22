"use client";

import { SORT_OPTIONS } from "../../../constants/filterOptions";
import { CloseIcon } from "../../ui/icons/CloseIcon";
import styles from "./ActiveFilterChips.module.css";

function sortLabel(sort) {
  if (!sort) return null;
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort;
}

/**
 * Muestra filtros aplicados como chips removibles + orden si hay.
 */
export default function ActiveFilterChips({
  chips = [],
  sort = null,
  onRemoveChip,
  onClearSort,
  disabled = false,
}) {
  const sortText = sortLabel(sort);
  if (chips.length === 0 && !sortText) return null;

  return (
    <div
      className={styles.wrap}
      role="region"
      aria-label="Filtros aplicados"
    >
      <ul className={styles.list}>
        {chips.map((chip) => (
          <li key={chip.id} className={styles.item}>
            <span className={styles.label}>{chip.label}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Quitar filtro ${chip.label}`}
              disabled={disabled}
              onClick={() => onRemoveChip(chip.nextFilters)}
            >
              <CloseIcon size={14} />
            </button>
          </li>
        ))}
        {sortText ? (
          <li className={styles.item}>
            <span className={styles.label}>{sortText}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label="Quitar orden"
              disabled={disabled}
              onClick={() => onClearSort?.()}
            >
              <CloseIcon size={14} />
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
