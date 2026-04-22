'use client'

import { useState, useCallback, useMemo } from 'react'
import MultiSelect from '@/components/ui/MultiSelect/MultiSelect'
import RangeSlider from '@/components/ui/RangeSlider/RangeSlider'
import { marcas, FILTER_BOUNDS } from '@/constants/filterOptions'
import styles from './AdminFilters.module.css'

const marcaOptions = ['Todas las marcas', ...marcas]

export default function AdminFilters({ onFiltersChange, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    marca: initialFilters.marca || [],
    año: initialFilters.año || [FILTER_BOUNDS.AÑO.min, FILTER_BOUNDS.AÑO.max],
  })

  const handleMarcaChange = useCallback(
    (selectedMarcas) => {
      const newFilters = { ...filters, marca: selectedMarcas }
      setFilters(newFilters)
      onFiltersChange?.(newFilters)
    },
    [filters, onFiltersChange]
  )

  const handleAñoChange = useCallback(
    (añoRange) => {
      const newFilters = { ...filters, año: añoRange }
      setFilters(newFilters)
      onFiltersChange?.(newFilters)
    },
    [filters, onFiltersChange]
  )

  const handleMarcaSelect = useCallback(
    (selected) => {
      if (selected.includes('Todas las marcas')) {
        handleMarcaChange(marcaOptions.slice(1))
      } else {
        handleMarcaChange(selected.filter((m) => m !== 'Todas las marcas'))
      }
    },
    [handleMarcaChange]
  )

  const marcaSummary = useMemo(() => {
    const m = filters.marca
    if (!m?.length) return 'Todas las marcas'
    if (m.length >= marcas.length) return 'Todas'
    if (m.length === 1) return m[0]
    return `${m.length} marcas`
  }, [filters.marca])

  const añoSummary = useMemo(() => {
    const [min, max] = filters.año
    return `${min} – ${max}`
  }, [filters.año])

  const canReset = useMemo(() => {
    const [a, b] = filters.año
    return (
      filters.marca.length > 0 ||
      a !== FILTER_BOUNDS.AÑO.min ||
      b !== FILTER_BOUNDS.AÑO.max
    )
  }, [filters.marca, filters.año])

  const handleReset = useCallback(() => {
    const cleared = {
      marca: [],
      año: [FILTER_BOUNDS.AÑO.min, FILTER_BOUNDS.AÑO.max],
    }
    setFilters(cleared)
    onFiltersChange?.(cleared)
  }, [onFiltersChange])

  const summaryHint = useMemo(() => {
    if (!canReset) return 'Sin filtros'
    return `${marcaSummary} · ${añoSummary}`
  }, [canReset, marcaSummary, añoSummary])

  return (
    <details className={styles.filterDetails}>
      <summary className={styles.filterSummary}>
        <span className={styles.filterSummaryCaret} aria-hidden />
        <span className={styles.filterSummaryLabel}>Filtros</span>
        <span className={styles.filterSummaryMeta}>{summaryHint}</span>
      </summary>
      <div className={styles.filterBody}>
        <div className={`${styles.filterRow} ${canReset ? styles.filterRowHasReset : ''}`}>
          <div className={styles.filterCell}>
            <MultiSelect
              label="Marca"
              options={marcaOptions}
              value={
                filters.marca.includes('Todas las marcas')
                  ? marcaOptions.slice(1)
                  : filters.marca
              }
              onChange={handleMarcaSelect}
              placeholder="Marca"
              searchable
              searchPlaceholder="Buscar marca…"
            />
          </div>
          <div className={styles.filterCell}>
            <div className={styles.rangeSliderHost}>
              <RangeSlider
                label="Año"
                min={FILTER_BOUNDS.AÑO.min}
                max={FILTER_BOUNDS.AÑO.max}
                step={1}
                value={filters.año}
                onChange={handleAñoChange}
                formatValue={(val) => val.toString()}
              />
            </div>
          </div>
          {canReset ? (
            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.filterReset}
                onClick={handleReset}
              >
                Limpiar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </details>
  )
}
