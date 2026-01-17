"use client";

/**
 * FilterFormSimple - Formulario de filtros unificado
 * 
 * Maneja tanto mobile (drawer) como desktop (visibilidad)
 * 
 * Principios:
 * - Sin over-engineering
 * - Lógica directa y clara
 * - Misma funcionalidad, menos código
 * - Performance optimizada
 * 
 * @author Indiana Peugeot
 * @version 2.0.0 - Migrado a Next.js
 */

import { useState, useEffect, useCallback, useRef, forwardRef, memo, useImperativeHandle, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import RangeSlider from '../../ui/RangeSlider/RangeSlider'
import MultiSelect from '../../ui/MultiSelect/MultiSelect'
import { CloseIcon } from '../../ui/icons/CloseIcon'
import { combustibles, cajas, FILTER_DEFAULTS } from '../../../constants/filterOptions'
import { parseFilters } from '../../../utils/filters'
import { useDevice } from '../../../hooks/useDevice'
import styles from './FilterFormSimple.module.css'

// ✅ FIX HIDRATACIÓN: Función de formateo consistente entre servidor y cliente
// Usa formato manual para evitar diferencias de configuración regional
const formatNumber = (val) => {
  // Formato manual con comas como separador de miles (consistente en servidor y cliente)
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatPrice = (val) => {
  return `$${formatNumber(val)}`
}

const formatKilometers = (val) => {
  return `${formatNumber(val)} km`
}

// ✅ COMPONENTE CON forwardRef
const FilterFormSimpleComponent = forwardRef(({
  onApplyFilters,
  isLoading = false,
  isError = false,
  error = null,
  onRetry = null,
}, ref) => {
  const { isMobile } = useDevice()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // ✅ ESTADOS SIMPLES
  // Estado para visibilidad en desktop
  const [isVisibleDesktop, setIsVisibleDesktop] = useState(false)
  // Estado para drawer en mobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timeoutRef = useRef(null)
  
  // ✅ FIX HIDRATACIÓN: Estado para saber si el componente ya se montó en el cliente
  // Esto evita diferencias entre servidor y cliente en el render inicial
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ✅ FILTROS - ESTADO SIMPLE
  const [filters, setFilters] = useState({
    marca: [],
    caja: [],
    combustible: [],
    año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
    precio: [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
    kilometraje: [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max]
  })

  // ✅ SINCRONIZACIÓN DE ESTADOS AL CAMBIAR DISPOSITIVO
  useEffect(() => {
    if (isMobile) {
      // En mobile, cerrar visibilidad desktop
      setIsVisibleDesktop(false)
    } else {
      // En desktop, cerrar drawer mobile
      setIsDrawerOpen(false)
    }
  }, [isMobile])

  // ✅ BLOQUEAR SCROLL DEL BODY CUANDO EL DRAWER ESTÁ ABIERTO
  useEffect(() => {
    if (!isDrawerOpen) return
    
    // Guardar posición actual del scroll
    const scrollY = window.scrollY
    const body = document.body
    
    // Aplicar estilos para bloquear scroll (compatible con iOS)
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.overflow = 'hidden'
    
    // Cleanup: restaurar scroll al cerrar
    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.overflow = ''
      // Restaurar posición del scroll
      window.scrollTo(0, scrollY)
    }
  }, [isDrawerOpen])

  // ✅ SINCRONIZACIÓN CON URL
  useEffect(() => {
    const urlFilters = parseFilters(searchParams)
    setFilters(prevFilters => ({
      marca: urlFilters.marca || [],
      caja: urlFilters.caja || [],
      combustible: urlFilters.combustible || [],
      año: urlFilters.año || [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
      precio: urlFilters.precio || [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
      kilometraje: urlFilters.kilometraje || [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max]
    }))
    // sort se maneja en la página Vehiculos
  }, [searchParams])


  // ✅ HANDLERS UNIFICADOS (funcionan en ambos contextos)
  const toggleVisibility = useCallback(() => {
    if (isMobile) {
      setIsDrawerOpen(prev => !prev)
    } else {
      setIsVisibleDesktop(prev => !prev)
    }
  }, [isMobile])

  const closeVisibility = useCallback(() => {
    if (isMobile) {
      setIsDrawerOpen(false)
    } else {
      setIsVisibleDesktop(false)
    }
  }, [isMobile])

  // ✅ HANDLERS SIMPLES (mantener para compatibilidad)
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  // ✅ HANDLERS DE FILTROS
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleClear = useCallback(() => {
    setFilters({
      marca: [],
      caja: [],
      combustible: [],
      año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
      precio: [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
      kilometraje: [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max]
    })
    router.push(window.location.pathname)
  }, [router])

  // Cerrar con Escape y devolver foco al trigger
  useEffect(() => {
    if (!isDrawerOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])


  // ✅ SUBMIT
  const onSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Cerrar según dispositivo (desktop o mobile)
      closeVisibility()
      await onApplyFilters(filters)
    } catch (error) {
      console.error('[FilterFormSimple] Error applying filters:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ CLEANUP
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  // ✅ REF INTERFACE UNIFICADA (compatibilidad con ambos sistemas)
  useImperativeHandle(ref, () => ({
    // Métodos originales (para mobile - compatibilidad)
    toggleDrawer,
    closeDrawer,
    isDrawerOpen: isMobile ? isDrawerOpen : isVisibleDesktop,
    
    // Métodos de LazyFilterFormSimple (para desktop - compatibilidad)
    toggleFilters: toggleVisibility,
    showFilters: () => setIsVisibleDesktop(true),
    hideFilters: () => setIsVisibleDesktop(false),
    isFiltersVisible: isMobile ? isDrawerOpen : isVisibleDesktop,
    
    // ✅ NUEVO: Método para actualizar marca desde afuera (carrusel cuando panel está abierto)
    updateMarcaFilter: (marcaArray) => {
      setFilters(prev => ({ ...prev, marca: marcaArray }))
    },
    
    // ✅ NUEVO: Método para obtener estado local actual (para carrusel cuando panel está abierto)
    getCurrentFilters: () => filters,
  }), [isMobile, isDrawerOpen, isVisibleDesktop, toggleDrawer, closeDrawer, toggleVisibility, filters])

  // ✅ CONTEO DE FILTROS ACTIVOS (memoizado para evitar recálculos)
  const activeFiltersCount = useMemo(() => {
    return [
      filters.marca?.length > 0,
      filters.caja?.length > 0,
      filters.combustible?.length > 0,
      filters.año[0] !== FILTER_DEFAULTS.AÑO.min || filters.año[1] !== FILTER_DEFAULTS.AÑO.max,
      filters.precio[0] !== FILTER_DEFAULTS.PRECIO.min || filters.precio[1] !== FILTER_DEFAULTS.PRECIO.max,
      filters.kilometraje[0] !== FILTER_DEFAULTS.KILOMETRAJE.min || filters.kilometraje[1] !== FILTER_DEFAULTS.KILOMETRAJE.max
    ].filter(Boolean).length;
  }, [filters])

  // ✅ CONTENIDO DEL FORMULARIO (reutilizable)
  const formContent = (
    <div className={`${styles.filterContainer} ${isDrawerOpen ? styles.open : ''}`}>
      {/* Error Messages */}
      {isError && error && (
        <div className={styles.errorMessage}>
          ⚠️ Error: {error.message || error}
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton} disabled={isLoading}>
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Filter Form */}
      {isDrawerOpen && (
        <div className={styles.overlay} onClick={closeDrawer} />
      )}
      
      <div className={styles.formWrapper}>
        <form id="filterForm" onSubmit={onSubmit} className={styles.form}>
          {/* Título y botones de cierre solo en mobile */}
          <div className={styles.formTitle}>
            <button type="button" onClick={closeDrawer} className={styles.closeButtonMobile}>
              <CloseIcon size={28} />
            </button>
          </div>

          {/* MultiSelects - Primero los selects */}
          {/* ✅ ELIMINADO: Input de marca - ahora se usa el carrusel de marcas */}
          <div className={styles.selectsSection}>
            {/* ✅ Botones dentro del grid ocupando el espacio del input faltante */}
            <div className={styles.desktopButtons}>
              <button type="button" onClick={handleClear} className={styles.clearButton} disabled={isLoading || isSubmitting}>
                Limpiar
              </button>
              <button type="submit" className={styles.applyButton} disabled={isLoading || isSubmitting}>
                {isSubmitting ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
            
            <div className={styles.formGroup}>
              <MultiSelect
                label="Caja"
                options={cajas}
                value={filters.caja}
                onChange={(val) => handleFilterChange('caja', val)}
                placeholder="Todas las cajas"
              />
            </div>
            
            <div className={styles.formGroup}>
              <MultiSelect
                label="Combustible"
                options={combustibles}
                value={filters.combustible}
                onChange={(val) => handleFilterChange('combustible', val)}
                placeholder="Seleccionar combustibles"
              />
            </div>
          </div>

          {/* Range Sliders - Después los rangos */}
          <div className={styles.rangesSection}>
            <div className={styles.formGroup}>
              <RangeSlider
                label="Año"
                min={FILTER_DEFAULTS.AÑO.min}
                max={FILTER_DEFAULTS.AÑO.max}
                step={1}
                value={filters.año}
                onChange={(val) => handleFilterChange('año', val)}
                formatValue={(val) => val.toString()}
              />
            </div>
            <div className={styles.formGroup}>
              <RangeSlider
                label="Precio"
                min={FILTER_DEFAULTS.PRECIO.min}
                max={FILTER_DEFAULTS.PRECIO.max}
                step={1000000}
                value={filters.precio}
                onChange={(val) => handleFilterChange('precio', val)}
                formatValue={formatPrice}
              />
            </div>
            <div className={styles.formGroup}>
              <RangeSlider
                label="km"
                min={FILTER_DEFAULTS.KILOMETRAJE.min}
                max={FILTER_DEFAULTS.KILOMETRAJE.max}
                step={5000}
                value={filters.kilometraje}
                onChange={(val) => handleFilterChange('kilometraje', val)}
                formatValue={formatKilometers}
              />
            </div>
          </div>

          {/* ✅ Botones - Al final del formulario en mobile */}
          <div className={styles.mobileButtons}>
            <button type="button" onClick={handleClear} className={styles.clearButton} disabled={isLoading || isSubmitting}>
              Limpiar
            </button>
            <button type="submit" className={styles.applyButton} disabled={isLoading || isSubmitting}>
              {isSubmitting ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // ✅ FIX HIDRATACIÓN: Renderizar igual en servidor y cliente inicialmente
  // Después de la hidratación, aplicar la lógica de mobile/desktop
  if (!isMounted) {
    // Durante SSR y primera renderización, renderizar como mobile para evitar mismatch
    return formContent
  }

  // ✅ EN DESKTOP: Renderizar siempre manteniendo el ancho completo, con efecto slide simple
  if (!isMobile) {
    return (
      <div className={isVisibleDesktop ? styles.desktopVisible : styles.desktopHidden}>
        {formContent}
      </div>
    )
  }

  // ✅ EN MOBILE: Renderizar directamente (comportamiento original)
  return formContent
})

FilterFormSimpleComponent.displayName = 'FilterFormSimple'

// ✅ ENVOLVER CON memo PARA OPTIMIZACIÓN
const FilterFormSimple = memo(FilterFormSimpleComponent)
FilterFormSimple.displayName = 'FilterFormSimple'

export default FilterFormSimple

