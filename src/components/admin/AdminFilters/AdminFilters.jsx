/**
 * AdminFilters - Componente de filtros para el panel administrativo
 * 
 * Filtros simplificados: Marca y Año
 * 
 * @author Indiana Usados
 * @version 1.0.0 - Next.js compatible
 */

'use client'

import { useState, useCallback } from 'react'
import MultiSelect from '@/components/ui/MultiSelect/MultiSelect'
import RangeSlider from '@/components/ui/RangeSlider/RangeSlider'
import { marcas, FILTER_DEFAULTS } from '@/constants/filterOptions'
import styles from './AdminFilters.module.css'

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

  // Opciones de marca con "Todas las marcas"
  const marcaOptions = ['Todas las marcas', ...marcas]

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

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <MultiSelect
          label="Marca"
          options={marcaOptions}
          value={filters.marca.includes('Todas las marcas') ? marcaOptions.slice(1) : filters.marca}
          onChange={handleMarcaSelect}
          placeholder="Seleccionar marca"
        />
      </div>

      <div className={styles.filterGroup}>
        <RangeSlider
          label="Año"
          min={FILTER_DEFAULTS.AÑO.min}
          max={FILTER_DEFAULTS.AÑO.max}
          step={1}
          value={filters.año}
          onChange={handleAñoChange}
          formatValue={(val) => val.toString()}
        />
      </div>
    </div>
  )
}

