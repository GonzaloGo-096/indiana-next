"use client";

/**
 * UsadosFilters - Formulario de filtros
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { useState, useCallback } from "react";
import styles from "./usados.module.css";

export default function UsadosFilters({
  initialFilters = {},
  onApplyFilters,
  onClearFilters,
  isLoading = false,
}) {
  const [filters, setFilters] = useState(initialFilters);

  const handleChange = useCallback((field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onApplyFilters(filters);
    },
    [filters, onApplyFilters]
  );

  const handleClear = useCallback(() => {
    setFilters({});
    onClearFilters();
  }, [onClearFilters]);

  return (
    <div className={styles.filtersSection}>
      <form onSubmit={handleSubmit} className={styles.filtersForm}>
        {/* Filtros básicos - simplificado por ahora */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="marca">Marca</label>
            <input
              id="marca"
              type="text"
              value={filters.marca?.[0] || ""}
              onChange={(e) =>
                handleChange("marca", e.target.value ? [e.target.value] : [])
              }
              placeholder="Ej: Peugeot"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="anioMin">Año mínimo</label>
            <input
              id="anioMin"
              type="number"
              min="2000"
              max="2025"
              value={filters.año?.[0] || ""}
              onChange={(e) => {
                const min = Number(e.target.value) || 2000;
                const max = filters.año?.[1] || 2025;
                handleChange("año", [min, max]);
              }}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="anioMax">Año máximo</label>
            <input
              id="anioMax"
              type="number"
              min="2000"
              max="2025"
              value={filters.año?.[1] || ""}
              onChange={(e) => {
                const min = filters.año?.[0] || 2000;
                const max = Number(e.target.value) || 2025;
                handleChange("año", [min, max]);
              }}
            />
          </div>
        </div>

        <div className={styles.filtersActions}>
          <button type="submit" disabled={isLoading} className={styles.filterButton}>
            {isLoading ? "Buscando..." : "Aplicar filtros"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className={styles.filterButtonSecondary}
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}

