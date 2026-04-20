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

import { useState, useRef, useEffect, useCallback, memo } from 'react'
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
  /** `onDark`: valores y separador en claro (p. ej. filtros sobre fondo oscuro). */
  variant = 'default',
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

  // Porcentaje visual en el track (misma fórmula que getPercentage antes)
  const minPercentage = ((localValue[0] - min) / (max - min)) * 100
  const maxPercentage = ((localValue[1] - min) / (max - min)) * 100

  // Click / drag: porcentaje → valor alineado a step (misma fórmula que antes)
  const getValueFromPercentage = useCallback((percentage) => {
    const rawValue = (percentage / 100) * (max - min) + min
    return Math.round((rawValue - min) / step) * step + min
  }, [min, max, step])

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
  }, [localValue, min, max, step, handleChange, getValueFromPercentage])

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
  }, [activeThumb, localValue, min, max, step, handleChange, getValueFromPercentage])

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

  const variantClass = variant === 'onDark' ? styles.onDark : ''

  return (
    <div className={`${styles.rangeSlider} ${variantClass} ${className}`.trim()}>
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
