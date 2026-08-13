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
import RangeSlider from '@/components/ui/RangeSlider/RangeSlider'
import { CloseIcon } from '@/components/ui/icons/CloseIcon'
import { combustibles, cajas, FILTER_BOUNDS, FILTER_DEFAULTS } from '@/constants/filterOptions'
import { useDevice } from '@/hooks/useDevice'
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
/**
 * Valor por defecto de currentFilters, definido UNA sola vez.
 *
 * Antes el valor por defecto se escribía inline (`currentFilters = {}`), y eso
 * crea un objeto nuevo en cada dibujo. El efecto que sincroniza los filtros
 * depende de esa referencia, así que se disparaba siempre: cambiaba el estado,
 * volvía a dibujar, creaba otro objeto nuevo, y así sin fin. Un ciclo infinito
 * que cuelga la pestaña.
 *
 * Hoy no explota porque VehiculosClient siempre pasa la prop, pero cualquier
 * uso nuevo sin ella colgaba la página. Lo encontró una prueba al montar el
 * componente sin filtros.
 */
const SIN_FILTROS = Object.freeze({});

const FilterFormSimpleComponent = forwardRef(({
  onApplyFilters,
  currentFilters = SIN_FILTROS, // Filtros actuales desde el padre (evita useSearchParams)
  isLoading = false,
  isError = false,
  error = null,
  onRetry = null,
  /** Lista /usados/vehiculos: integrar en franja toolbar sin segunda caja ni breakout 100vw */
  stripLayout = false,
  /** Solo strip: avisa si el panel de filtros está abierto (p. ej. borde en VehiculosClient) */
  onStripFiltersOpenChange,
}, ref) => {
  const { isMobile } = useDevice()

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
  const stripPanelEndRef = useRef(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  /* Strip: al abrir, bajar la vista al pie del formulario (Aplicar); delay breve por título Marca en el padre */
  useEffect(() => {
    if (!stripLayout || !isVisibleDesktop) return
    const el = stripPanelEndRef.current
    if (!el) return
    const t = window.setTimeout(() => {
      el.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }, 140)
    return () => window.clearTimeout(t)
  }, [stripLayout, isVisibleDesktop])

  useEffect(() => {
    if (!stripLayout || !onStripFiltersOpenChange) return
    onStripFiltersOpenChange(isVisibleDesktop)
    return () => {
      onStripFiltersOpenChange(false)
    }
  }, [stripLayout, isVisibleDesktop, onStripFiltersOpenChange])

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

  // ✅ SINCRONIZACIÓN CON FILTROS DEL PADRE (elimina necesidad de useSearchParams)
  // ✅ FIX SUSPENSE: Usar prop en lugar de useSearchParams para evitar conflictos de boundaries
  useEffect(() => {
    setFilters(prevFilters => ({
      marca: currentFilters.marca || [],
      caja: currentFilters.caja || [],
      combustible: currentFilters.combustible || [],
      año: currentFilters.año || [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
      precio: currentFilters.precio || [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
      kilometraje: currentFilters.kilometraje || [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max]
    }))
    // sort se maneja en la página Vehiculos
  }, [currentFilters])


  // ✅ HANDLERS UNIFICADOS (funcionan en ambos contextos)
  const toggleVisibility = useCallback(() => {
    if (stripLayout) {
      setIsVisibleDesktop((prev) => !prev)
      return
    }
    if (isMobile) {
      setIsDrawerOpen((prev) => !prev)
    } else {
      setIsVisibleDesktop((prev) => !prev)
    }
  }, [isMobile, stripLayout])

  const closeVisibility = useCallback(() => {
    if (stripLayout) {
      setIsVisibleDesktop(false)
      return
    }
    if (isMobile) {
      setIsDrawerOpen(false)
    } else {
      setIsVisibleDesktop(false)
    }
  }, [isMobile, stripLayout])

  // ✅ HANDLERS SIMPLES (mantener para compatibilidad)
  const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), [])
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  // ✅ HANDLERS DE FILTROS
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleCaja = useCallback((option) => {
    setFilters((prev) => {
      const has = prev.caja.includes(option)
      const caja = has ? prev.caja.filter((x) => x !== option) : [...prev.caja, option]
      return { ...prev, caja }
    })
  }, [])

  const toggleCombustible = useCallback((option) => {
    setFilters((prev) => {
      const has = prev.combustible.includes(option)
      const combustible = has
        ? prev.combustible.filter((x) => x !== option)
        : [...prev.combustible, option]
      return { ...prev, combustible }
    })
  }, [])

  const handleClear = useCallback(() => {
    const empty = {
      marca: [],
      caja: [],
      combustible: [],
      año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
      precio: [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max],
      kilometraje: [FILTER_DEFAULTS.KILOMETRAJE.min, FILTER_DEFAULTS.KILOMETRAJE.max]
    };
    setFilters(empty);
    onApplyFilters({});
  }, [onApplyFilters])

  // Cerrar con Escape (drawer móvil clásico o panel strip móvil/desktop)
  useEffect(() => {
    const panelOpen = stripLayout
      ? isVisibleDesktop
      : isMobile
        ? isDrawerOpen
        : isVisibleDesktop
    if (!panelOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (stripLayout) setIsVisibleDesktop(false)
        else if (isMobile) setIsDrawerOpen(false)
        else setIsVisibleDesktop(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [stripLayout, isMobile, isDrawerOpen, isVisibleDesktop])


  // ✅ SUBMIT
  const onSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Cerrar según dispositivo (desktop o mobile)
      closeVisibility()
      await onApplyFilters(filters)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[FilterFormSimple] Error applying filters:', error);
      }
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
    isDrawerOpen: stripLayout
      ? isVisibleDesktop
      : isMobile
        ? isDrawerOpen
        : isVisibleDesktop,

    // Métodos de LazyFilterFormSimple (para desktop - compatibilidad)
    toggleFilters: toggleVisibility,
    showFilters: () => setIsVisibleDesktop(true),
    hideFilters: () => setIsVisibleDesktop(false),
    isFiltersVisible: stripLayout
      ? isVisibleDesktop
      : isMobile
        ? isDrawerOpen
        : isVisibleDesktop,
    
    // ✅ NUEVO: Método para actualizar marca desde afuera (carrusel cuando panel está abierto)
    updateMarcaFilter: (marcaArray) => {
      setFilters(prev => ({ ...prev, marca: marcaArray }))
    },
    
    // ✅ NUEVO: Método para obtener estado local actual (para carrusel cuando panel está abierto)
    getCurrentFilters: () => filters,
  }), [
    isMobile,
    stripLayout,
    isDrawerOpen,
    isVisibleDesktop,
    toggleDrawer,
    closeDrawer,
    toggleVisibility,
    filters,
  ])

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
    <div
      className={`${styles.filterContainer} ${stripLayout ? styles.filterContainerStrip : ''} ${!stripLayout && isDrawerOpen ? styles.open : ''}`}
    >
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
      {!stripLayout && isDrawerOpen && (
        <div className={styles.overlay} onClick={closeVisibility} />
      )}
      
      <div className={styles.formWrapper}>
        <form id="filterForm" onSubmit={onSubmit} className={styles.form}>
          {/* Título y botones de cierre solo en mobile */}
          <div className={styles.formTitle}>
            <span className={styles.drawerTitle}>Filtros</span>
            <button
              type="button"
              onClick={closeVisibility}
              className={styles.closeButtonMobile}
              aria-label="Cerrar filtros"
            >
              <CloseIcon size={22} />
            </button>
          </div>

          <div
            className={`${styles.formBody} ${stripLayout ? styles.formBodyStrip : ""}`}
          >
            <div className={styles.formColumn}>
              <div
                className={`${styles.selectsSection} ${stripLayout ? styles.selectsSectionStrip : ""}`}
              >
                <div className={styles.formGroup}>
                  <fieldset className={styles.filterChoiceFieldset}>
                    <legend className={styles.filterChoiceLegend}>Caja de cambios</legend>
                    <div className={styles.checkboxRow}>
                      {cajas.map((opt) => (
                        <label key={opt} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={filters.caja.includes(opt)}
                            onChange={() => toggleCaja(opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>

            <div className={styles.formColumn}>
              <div className={styles.rangesSection}>
                <div className={styles.formGroup}>
                  <RangeSlider
                    label="Año"
                    min={FILTER_BOUNDS.AÑO.min}
                    max={FILTER_BOUNDS.AÑO.max}
                    step={1}
                    value={filters.año}
                    onChange={(val) => handleFilterChange("año", val)}
                    formatValue={(val) => val.toString()}
                  />
                </div>
                <div className={styles.formGroup}>
                  <RangeSlider
                    label="Precio"
                    min={FILTER_BOUNDS.PRECIO.min}
                    max={FILTER_BOUNDS.PRECIO.max}
                    step={1000000}
                    value={filters.precio}
                    onChange={(val) => handleFilterChange("precio", val)}
                    formatValue={formatPrice}
                  />
                </div>
                <div className={styles.formGroup}>
                  <RangeSlider
                    label="km"
                    min={FILTER_BOUNDS.KILOMETRAJE.min}
                    max={FILTER_BOUNDS.KILOMETRAJE.max}
                    step={5000}
                    value={filters.kilometraje}
                    onChange={(val) => handleFilterChange("kilometraje", val)}
                    formatValue={formatKilometers}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formColumn}>
              <div
                className={`${styles.selectsSection} ${stripLayout ? styles.selectsSectionStrip : ""}`}
              >
                <div className={styles.formGroup}>
                  <fieldset className={styles.filterChoiceFieldset}>
                    <legend className={styles.filterChoiceLegend}>Combustible</legend>
                    <div className={styles.checkboxRow}>
                      {combustibles.map((opt) => (
                        <label key={opt} className={styles.checkboxItem}>
                          <input
                            type="checkbox"
                            checked={filters.combustible.includes(opt)}
                            onChange={() => toggleCombustible(opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Botones desktop: al final de la fila; mobile: dentro de mobileButtons */}
          <div className={styles.desktopButtons}>
            <button type="button" onClick={handleClear} className={styles.clearButton} disabled={isLoading || isSubmitting}>
              Limpiar
            </button>
            <button type="submit" className={styles.applyButton} disabled={isLoading || isSubmitting}>
              {isSubmitting ? 'Aplicando...' : 'Aplicar'}
            </button>
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
          {stripLayout && (
            <div
              ref={stripPanelEndRef}
              className={styles.stripPanelScrollAnchor}
              aria-hidden
            />
          )}
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

  // ✅ Desktop, o strip en móvil: panel con show/hide (mismo patrón que desktop)
  if (!isMobile || stripLayout) {
    return (
      <div className={isVisibleDesktop ? styles.desktopVisible : styles.desktopHidden}>
        {formContent}
      </div>
    )
  }

  // ✅ Móvil sin strip: drawer inferior (comportamiento clásico)
  return formContent
})

FilterFormSimpleComponent.displayName = 'FilterFormSimple'

// ✅ ENVOLVER CON memo PARA OPTIMIZACIÓN
// FilterFormSimpleComponent ya está envuelto con forwardRef, solo agregamos memo
const FilterFormSimple = memo(FilterFormSimpleComponent)
FilterFormSimple.displayName = 'FilterFormSimple'

export default FilterFormSimple

