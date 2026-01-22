"use client";

/**
 * MultiSelect - Componente ultra simple y eficiente
 * 
 * Principios: Simplicidad, Performance, Mantenibilidad
 * - Sin over-engineering
 * - Lógica mínima y clara
 * - Performance optimizada sin complejidad
 * 
 * @author Indiana Peugeot
 * @version 3.1.0 - OPTIMIZADO
 */

import { useState, useRef, useEffect, useMemo, useId, memo } from 'react'
import { ChevronIcon } from '../icons/ChevronIcon'
import styles from './MultiSelect.module.css'

const MultiSelect = memo(({
  options = [],
  value = [],
  onChange,
  label,
  placeholder = "Seleccionar opciones",
  className = '',
  disabled = false,
  error = false,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const labelId = useId()
  const dropdownRef = useRef(null)

  // Validación simple y eficiente
  const validOptions = useMemo(() => 
    Array.isArray(options) ? options.filter(Boolean) : [], 
    [options]
  )

  const validValue = useMemo(() => 
    Array.isArray(value) ? value.filter(Boolean) : [], 
    [value]
  )

  // Set para O(1) lookups - ÚNICA optimización crítica
  const selectedSet = useMemo(() => new Set(validValue), [validValue])

  // Click outside - Lógica simple
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Toggle option - Lógica ultra simple
  const handleToggleOption = (option) => {
    if (disabled) return

    const newValues = selectedSet.has(option)
      ? validValue.filter(val => val !== option)
      : [...validValue, option]
    
    onChange?.(newValues)
  }

  // Toggle dropdown - Lógica simple
  const handleToggleDropdown = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  // Keyboard navigation - Lógica simple
  const handleKeyDown = (event) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        handleToggleDropdown()
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Display text
  const displayText = validValue.length > 0 
    ? `${validValue.length} seleccionado${validValue.length > 1 ? 's' : ''}`
    : placeholder

  return (
    <div className={`${styles.multiSelect} ${className}`}>
      {label && (
        <label className={styles.label} id={labelId}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      
      <div className={styles.container} ref={dropdownRef}>
        <button
          type="button"
          className={`${styles.trigger} ${isOpen ? styles.open : ''} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
          onClick={handleToggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel || `${label} selector`}
          aria-describedby={ariaDescribedBy}
          tabIndex={disabled ? -1 : 0}
        >
          <span className={styles.text}>{displayText}</span>
          <ChevronIcon size={16} direction={isOpen ? "up" : "down"} className={styles.arrow} />
        </button>

        {isOpen && (
          <div 
            className={styles.dropdown}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={labelId}
          >
            <div className={styles.options}>
              {validOptions.length > 0 ? (
                validOptions.map((option) => (
                  <label 
                    key={option} 
                    className={styles.option}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleToggleOption(option)
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSet.has(option)}
                      onChange={() => handleToggleOption(option)}
                      className={styles.checkbox}
                      disabled={disabled}
                    />
                    <span className={styles.optionText}>{option}</span>
                  </label>
                ))
              ) : (
                <div className={styles.emptyState}>
                  No hay opciones disponibles
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  )
})

MultiSelect.displayName = 'MultiSelect'

export default MultiSelect


