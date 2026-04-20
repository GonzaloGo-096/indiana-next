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
import { normalizeForSearch } from '@/utils/normalizeForSearch'
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
  searchable = false,
  searchPlaceholder = 'Buscar…',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const labelId = useId()
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

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

  const filteredOptions = useMemo(() => {
    if (!searchable) return validOptions
    const q = normalizeForSearch(searchQuery.trim())
    if (!q) return validOptions
    return validOptions.filter((opt) => normalizeForSearch(opt).includes(q))
  }, [searchable, validOptions, searchQuery])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      return
    }
    if (!searchable) return
    const id = requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen, searchable])

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
            className={`${styles.dropdown} ${searchable ? styles.dropdownSearchable : ''}`}
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby={labelId}
          >
            {searchable ? (
              <div className={styles.searchWrap}>
                <input
                  ref={searchInputRef}
                  type="search"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  disabled={disabled}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setIsOpen(false)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : null}
            <div className={styles.options}>
              {validOptions.length === 0 ? (
                <div className={styles.emptyState}>
                  No hay opciones disponibles
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className={styles.emptyState}>
                  Ninguna opción coincide con tu búsqueda
                </div>
              ) : (
                filteredOptions.map((option) => (
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



