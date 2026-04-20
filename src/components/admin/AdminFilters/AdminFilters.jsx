/**
 * AdminFilters - Componente de filtros para el panel administrativo
 * 
 * Filtros simplificados: Marca y Año
 * 
 * @author Indiana Usados
 * @version 1.0.0 - Next.js compatible
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import MultiSelect from '@/components/ui/MultiSelect/MultiSelect'
import RangeSlider from '@/components/ui/RangeSlider/RangeSlider'
import FilterIcon from '@/components/ui/icons/FilterIcon'
import { marcas, FILTER_DEFAULTS } from '@/constants/filterOptions'
import styles from './AdminFilters.module.css'

/** Opciones de marca con "Todas las marcas" — constante de módulo (referencia estable). */
const marcaOptions = ['Todas las marcas', ...marcas]

export default function AdminFilters({ onFiltersChange, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    marca: initialFilters.marca || [],
    año: initialFilters.año || [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max]
  })

  const handleMarcaChange = useCallback((selectedMarcas) => {
    const newFilters = { ...filters, marca: selectedMarcas }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  const handleAñoChange = useCallback((añoRange) => {
    const newFilters = { ...filters, año: añoRange }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  // Si "Todas las marcas" está seleccionado, mostrar todas
  const selectedMarcas = filters.marca.includes('Todas las marcas') 
    ? marcaOptions.slice(1) // Todas excepto "Todas las marcas"
    : filters.marca

  const handleMarcaSelect = useCallback((selected) => {
    if (selected.includes('Todas las marcas')) {
      // Si se selecciona "Todas las marcas", seleccionar todas
      handleMarcaChange(marcaOptions.slice(1))
    } else {
      // Si se deselecciona "Todas las marcas" o se selecciona otra marca
      handleMarcaChange(selected.filter(m => m !== 'Todas las marcas'))
    }
  }, [handleMarcaChange])

  const marcaSummary = useMemo(() => {
    const m = filters.marca
    if (!m?.length) return 'Marca: sin restricción'
    if (m.length >= marcas.length) return 'Marca: todas'
    if (m.length === 1) return `Marca: ${m[0]}`
    return `Marca: ${m.length} seleccionadas`
  }, [filters.marca])

  const añoSummary = useMemo(() => {
    const [min, max] = filters.año
    return `Año: ${min} – ${max}`
  }, [filters.año])

  const canReset = useMemo(() => {
    const [a, b] = filters.año
    return (
      filters.marca.length > 0 ||
      a !== FILTER_DEFAULTS.AÑO.min ||
      b !== FILTER_DEFAULTS.AÑO.max
    )
  }, [filters.marca, filters.año])

  const handleReset = useCallback(() => {
    const cleared = {
      marca: [],
      año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
    }
    setFilters(cleared)
    onFiltersChange?.(cleared)
  }, [onFiltersChange])

  return (
    <section className={styles.panel} aria-label="Filtros del inventario">
      <div className={styles.panelAccent} aria-hidden />

      <header className={styles.panelHeader}>
        <div className={styles.panelHeaderMain}>
          <span className={styles.panelIconWrap} aria-hidden>
            <FilterIcon size={20} strokeWidth={1.75} />
          </span>
          <div className={styles.panelTitles}>
            <h2 className={styles.panelTitle}>Filtros del inventario</h2>
            <p className={styles.panelSubtitle}>
              Los cambios se aplican al instante sobre el listado.
            </p>
          </div>
        </div>
        {canReset ? (
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            aria-label="Restablecer filtros de marca y año"
          >
            Restablecer
          </button>
        ) : null}
      </header>

      <div className={styles.summary} role="status" aria-live="polite">
        <span className={styles.summaryChip}>{marcaSummary}</span>
        <span className={styles.summaryChip}>{añoSummary}</span>
      </div>

      <div className={styles.controlsGrid}>
        <div className={styles.filterGroup}>
          <div className={styles.filterSurface}>
            <MultiSelect
              label="Marca"
              options={marcaOptions}
              value={filters.marca.includes('Todas las marcas') ? marcaOptions.slice(1) : filters.marca}
              onChange={handleMarcaSelect}
              placeholder="Seleccionar marca"
              searchable
              searchPlaceholder="Buscar marca…"
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterSurface}>
            <div className={styles.rangeSliderHost}>
              <RangeSlider
                label="Año"
                min={FILTER_DEFAULTS.AÑO.min}
                max={FILTER_DEFAULTS.AÑO.max}
                step={1}
                value={filters.año}
                onChange={handleAñoChange}
                formatValue={(val) => val.toString()}
                variant="onDark"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



