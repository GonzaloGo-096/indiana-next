"use client";

/**
 * RangeSlider - Componente de rango personalizado para filtros
 * 
 * Permite seleccionar un rango de valores con dos controles
 * Ideal para precio, kms y año
 * 
 * @author Indiana Peugeot
 * @version 1.2.0 - OPTIMIZADO
 */

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import styles from './RangeSlider.module.css'

const RangeSlider = memo(({
  min = 0,
  max = 100,
  step = 1,
  value = [min, max],
  onChange,
  label,
  formatValue = (val) => val,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isDragging, setIsDragging] = useState(false)
  const [activeThumb, setActiveThumb] = useState(null)
  const sliderRef = useRef(null)

  // Sincronizar con props externas
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Calcular posiciones - OPTIMIZADO: Funciones simples sin memoización
  const getPercentage = (val) => {
    return ((val - min) / (max - min)) * 100
  }

  // ✅ Función para redondear valores al múltiplo más cercano del step (estándar Material Design)
  const snapToStep = (value) => {
    return Math.round((value - min) / step) * step + min
  }

  const getValueFromPercentage = (percentage) => {
    const rawValue = (percentage / 100) * (max - min) + min
    return snapToStep(rawValue)
  }

  // Memoizar cálculos de posiciones para evitar recálculos
  const minPercentage = useMemo(() => getPercentage(localValue[0]), [localValue[0], min, max])
  const maxPercentage = useMemo(() => getPercentage(localValue[1]), [localValue[1], min, max])

  // Manejar cambios - MEMOIZADO Y OPTIMIZADO
  const handleChange = useCallback((newValue) => {
    setLocalValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  // Manejar clic en track - MEMOIZADO
  const handleTrackClick = useCallback((e) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = ((e.clientX - rect.left) / rect.width) * 100
    const newValue = getValueFromPercentage(percentage)

    // Determinar qué thumb actualizar
    const [minVal, maxVal] = localValue
    const distanceToMin = Math.abs(newValue - minVal)
    const distanceToMax = Math.abs(newValue - maxVal)

    let newMin = minVal
    let newMax = maxVal

    if (distanceToMin <= distanceToMax) {
      newMin = Math.max(min, Math.min(maxVal - step, newValue))
    } else {
      newMax = Math.min(max, Math.max(minVal + step, newValue))
    }

    handleChange([newMin, newMax])
  }, [localValue, min, max, step, handleChange])

  // Manejar arrastre de thumbs - MEMOIZADO
  const handleMouseDown = useCallback((thumb) => {
    setIsDragging(true)
    setActiveThumb(thumb)
  }, [])

  // Función compartida para calcular nuevo valor desde posición X
  const updateValueFromPosition = useCallback((clientX) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    const newValue = getValueFromPercentage(percentage)

    const [minVal, maxVal] = localValue

    if (activeThumb === 'min') {
      const newMin = Math.max(min, Math.min(maxVal - step, newValue))
      handleChange([newMin, maxVal])
    } else if (activeThumb === 'max') {
      const newMax = Math.min(max, Math.max(minVal + step, newValue))
      handleChange([minVal, newMax])
    }
  }, [activeThumb, localValue, min, max, step, handleChange])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    updateValueFromPosition(e.clientX)
  }, [isDragging, updateValueFromPosition])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setActiveThumb(null)
  }, [])

  // ✅ TOUCH EVENTS para mobile
  const handleTouchStart = useCallback((thumb) => (e) => {
    e.preventDefault() // Evita scroll del contenedor
    e.stopPropagation()
    setIsDragging(true)
    setActiveThumb(thumb)
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    const touch = e.touches[0]
    if (touch) {
      updateValueFromPosition(touch.clientX)
    }
  }, [isDragging, updateValueFromPosition])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    setActiveThumb(null)
  }, [])

  // Event listeners globales - Mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Event listeners globales - Touch
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      document.addEventListener('touchcancel', handleTouchEnd)
      return () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [isDragging, handleTouchMove, handleTouchEnd])

  return (
    <div className={`${styles.rangeSlider} ${className}`}>
      {label && <label className={styles.label} htmlFor={`${label}-slider`}>{label}</label>}
      
      <div className={styles.container}>
        <div 
          ref={sliderRef}
          className={styles.track}
          onClick={handleTrackClick}
          role="slider"
          aria-label={ariaLabel || `${label} range slider`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localValue[0]}
          aria-valuetext={`${formatValue(localValue[0])} to ${formatValue(localValue[1])}`}
          tabIndex={0}
          aria-describedby={ariaDescribedBy}
        >
          <div 
            className={styles.range}
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`
            }}
          />
          
          {/* Thumb mínimo */}
          <div
            className={`${styles.thumb} ${styles.thumbMin} ${activeThumb === 'min' ? styles.active : ''}`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => handleMouseDown('min')}
            onTouchStart={handleTouchStart('min')}
          >
            <div className={styles.tooltip}>
              {formatValue(localValue[0])}
            </div>
          </div>
          
          {/* Thumb máximo */}
          <div
            className={`${styles.thumb} ${styles.thumbMax} ${activeThumb === 'max' ? styles.active : ''}`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => handleMouseDown('max')}
            onTouchStart={handleTouchStart('max')}
          >
            <div className={styles.tooltip}>
              {formatValue(localValue[1])}
            </div>
          </div>
        </div>
        
        {/* Valores mostrados */}
        <div className={styles.values}>
          <span className={styles.value}>{formatValue(localValue[0])}</span>
          <span className={styles.separator}>-</span>
          <span className={styles.value}>{formatValue(localValue[1])}</span>
        </div>
      </div>
    </div>
  )
})

RangeSlider.displayName = 'RangeSlider'

export default RangeSlider

