/**
 * CarFormRHF - Formulario de autos con React Hook Form
 * 
 * @author Indiana Usados
 * @version 3.0.0 - Next.js compatible
 */

'use client'

import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import {
  useImageReducer,
  IMAGE_FIELDS,
  isImagePipelineBlocked,
} from '@/components/admin/hooks/useImageReducer'
import styles from './CarFormRHF.module.css'
import { FORM_RULES } from '@/constants/forms'
import { marcas as MARCAS_LIST } from '@/constants/filterOptions'
import { isValidImage, filterValidFiles } from '@/utils/files'
import { normalizeCilindrada } from '@/utils/formatters'
import { normalizeForSearch } from '@/utils/normalizeForSearch'

// ✅ CONSTANTES
const MODE = {
  CREATE: 'create',
  EDIT: 'edit'
}

// ✅ CAMPOS NUMÉRICOS (para coerción automática)
const NUMERIC_FIELDS = ['precio', 'anio', 'kilometraje']

// ✅ CAMPOS QUE NO SE ENVÍAN AL BACKEND
const EXCLUDED_FROM_FORMDATA = ['urls', 'precioOferta']

// ✅ PROPS DEL COMPONENTE
const CarFormRHF = ({ 
  mode, 
  initialData = {}, 
  onSubmitFormData,
  isLoading = false,
  onClose,
  /** Si es false, no se muestra el encabezado duplicado (p. ej. cuando el modal ya tiene título). */
  showTitle = true,
}) => {
  // ✅ HOOK PERSONALIZADO PARA MANEJO DE IMÁGENES
  const {
    imageState,
    initImageState,
    pickPrincipalImage,
    validateImages,
    buildImageFormData,
    getPreviewFor,
    cleanupObjectUrls,
    pickExtraFiles,
    removeExistingExtra,
    restoreExistingExtra,
  } = useImageReducer(mode, initialData)

  const pipelineBlocked = useMemo(() => isImagePipelineBlocked(imageState), [imageState])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    reset,
    control
  } = useForm({
    defaultValues: {
      marca: '',
      modelo: '',
      version: '',
      precio: '',
      caja: '',
      segmento: '',
      cilindrada: '',
      color: '',
      anio: '',
      combustible: '',
      kilometraje: '',
      traccion: '',
      HP: '',
      oferta: false,
      descuento: 0
    }
  })

  const ofertaValue = useWatch({ control, name: 'oferta', defaultValue: false })

  const [marcaDropdownOpen, setMarcaDropdownOpen] = useState(false)
  const [marcaSearchQuery, setMarcaSearchQuery] = useState('')
  const marcaDropdownRef = useRef(null)
  const marcaSearchInputRef = useRef(null)

  useEffect(() => {
    if (!marcaDropdownOpen) {
      setMarcaSearchQuery('')
      return
    }
    const id = requestAnimationFrame(() => {
      marcaSearchInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [marcaDropdownOpen])

  useEffect(() => {
    if (!marcaDropdownOpen) return
    const close = () => setMarcaDropdownOpen(false)
    const onPointerDown = (e) => {
      if (marcaDropdownRef.current && !marcaDropdownRef.current.contains(e.target)) {
        close()
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [marcaDropdownOpen])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) setMarcaDropdownOpen(false)
    })
    return () => {
      active = false
    }
  }, [initialData])

  /** Marcas del select + la del vehículo en edición si no está en el catálogo */
  const marcaSelectOptions = useMemo(() => {
    const current = initialData?.marca != null ? String(initialData.marca).trim() : ''
    if (current && !MARCAS_LIST.includes(current)) {
      return [current, ...MARCAS_LIST]
    }
    return MARCAS_LIST
  }, [initialData])

  const filteredMarcaSelectOptions = useMemo(() => {
    const q = normalizeForSearch(marcaSearchQuery.trim())
    if (!q) return marcaSelectOptions
    return marcaSelectOptions.filter((m) => normalizeForSearch(m).includes(q))
  }, [marcaSelectOptions, marcaSearchQuery])

  // ✅ INICIALIZAR FORMULARIO CON DATOS INICIALES
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const formData = { ...initialData }
      delete formData.urls // Los URLs se manejan por separado
      if ('precioOferta' in formData) delete formData.precioOferta

      reset(formData)
      initImageState(mode, initialData)
    }
  }, [initialData, mode, reset, initImageState])

  // ✅ HANDLER PARA AUTO-COMPLETAR CILINDRADA
  const handleCilindradaBlur = useCallback((e) => {
    let value = e.target.value.trim()
    if (!value) return
    
    // Si no tiene punto, agregar .0
    if (!value.includes('.')) {
      value = `${value}.0`
      setValue('cilindrada', value)
      return
    }
    
    // Si termina en punto, agregar 0
    if (value.endsWith('.')) {
      value = `${value}0`
      setValue('cilindrada', value)
      return
    }
    
    // Si tiene más de un decimal, truncar
    if (value.includes('.')) {
      const [integer, decimal] = value.split('.')
      if (decimal && decimal.length > 1) {
        value = `${integer}.${decimal[0]}`
        setValue('cilindrada', value)
      }
    }
  }, [setValue])

  // ✅ VALIDAR FORMULARIO COMPLETO
  const validateForm = useCallback((data) => {
    const errors = {}
    
    // ✅ VALIDAR CAMPOS REQUERIDOS
    const requiredFields = [
      'marca', 'modelo', 'precio', 'anio', 'caja', 'kilometraje'
    ]
    
    requiredFields.forEach(field => {
      if (!data[field] || data[field].toString().trim() === '') {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} es requerido`
      }
    })
    
    // ✅ VALIDAR NÚMEROS
    NUMERIC_FIELDS.forEach(field => {
      if (data[field] && isNaN(Number(data[field]))) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} debe ser un número válido`
      }
    })

    // ✅ VALIDAR OFERTA / DESCUENTO
    if (data.oferta === true || data.oferta === 'true') {
      const desc = Number(data.descuento)
      if (isNaN(desc) || desc < 0 || desc > 100) {
        errors.descuento = 'Descuento debe ser un número entre 0 y 100'
      }
    }

    // ✅ VALIDAR IMÁGENES SEGÚN MODO
    const imageErrors = validateImages(mode)
    Object.assign(errors, imageErrors)
    return errors
  }, [mode, validateImages])

  // ✅ CONSTRUIR FORMDATA SEGÚN MODO
  const buildVehicleFormData = useCallback((data) => {
    const formData = new FormData()
    const oferta = data.oferta === true || data.oferta === 'true'

    // ✅ AGREGAR CAMPOS DE DATOS PRIMITIVOS
    Object.entries(data).forEach(([key, value]) => {
      if (EXCLUDED_FROM_FORMDATA.includes(key) || key === 'oferta' || key === 'descuento') return

      if (NUMERIC_FIELDS.includes(key)) {
        const numValue = Number(value).toString()
        formData.append(key, numValue)
      } else if (key === 'cilindrada') {
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
          formData.append(key, numValue)
        }
      } else {
        formData.append(key, value)
      }
    })

    // ✅ OFERTA Y DESCUENTO (siempre enviar; inputs disabled pueden no estar en data)
    formData.append('oferta', oferta ? 'true' : 'false')
    formData.append('descuento', oferta ? String(Math.min(100, Math.max(0, Number(data.descuento) || 0))) : '0')
    
    // ✅ AGREGAR IMÁGENES SEGÚN ESTADO
    buildImageFormData(formData)
    
    return formData
  }, [buildImageFormData])

  // ✅ MANEJAR SUBMIT
  const onSubmit = async (data) => {
    try {
      clearErrors()

      // ✅ VALIDAR FORMULARIO
      const validationErrors = validateForm(data)

      if (Object.keys(validationErrors).length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[form:car] Errores de validación', Object.keys(validationErrors))
        }

        // ✅ MOSTRAR ERRORES
        Object.entries(validationErrors).forEach(([field, message]) => {
          setError(field, { type: 'manual', message })
        })
        return
      }

      // ✅ CONSTRUIR FORMDATA
      const formData = buildVehicleFormData(data)

      // ✅ AÑADIR _id EN MODO EDIT
      if (mode === MODE.EDIT) {
        const vehicleId = initialData._id || initialData.id
        if (vehicleId) {
          formData.append('_id', String(vehicleId))
        }
      }

      // ✅ DELEGAR SUBMIT AL PADRE
      await onSubmitFormData(formData)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[form:car] submit error', error)
      }
    }
  }

  // ✅ LIMPIAR OBJETOS URL AL DESMONTAJE
  useEffect(() => {
    return () => {
      cleanupObjectUrls()
    }
  }, [cleanupObjectUrls])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {showTitle ? (
        <div className={styles.formHeader}>
          <h2>{mode === MODE.CREATE ? 'Crear Nuevo Auto' : 'Editar Auto'}</h2>
          <p>Complete los campos requeridos</p>
        </div>
      ) : null}

      {/* ✅ SECCIÓN DE IMÁGENES PRINCIPALES */}
      <div className={styles.requiredFieldsSection}>
        <h4 className={styles.subsectionTitle}>
          <span className={styles.requiredBadge}>Fotos Obligatorias</span>
          <span className={styles.subsectionHint}>
            Formatos: JPG, PNG, WEBP · Optimización automática en el navegador antes de enviar
          </span>
        </h4>
        
        <div className={styles.principalImagesGrid}>
          {IMAGE_FIELDS.principales.map((field) => {
            const slot = imageState[field] || {}
            const { file, existingUrl, remove, processStatus, processError } = slot
            const preview = getPreviewFor(field)
            const optimizing = processStatus === 'optimizing'
            const ready = processStatus === 'ready' && !!file
            const failed = processStatus === 'error'

            return (
              <div key={field} className={styles.imageCard}>
                <label className={styles.imageLabel}>
                  {field === 'fotoPrincipal' ? 'Foto Principal *' : 'Foto Hover *'}
                </label>

                <div className={styles.imageContainer}>
                  {preview ? (
                    <img
                      src={preview}
                      alt={`Preview ${field}`}
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      <span>📷</span>
                      <p>Seleccionar imagen</p>
                    </div>
                  )}

                  {optimizing && (
                    <div className={styles.imageProcessOverlay}>
                      <span className={styles.imageSpinner} aria-hidden />
                      <span className={styles.imageProcessText}>Optimizando…</span>
                    </div>
                  )}

                  {remove && (
                    <div className={styles.removedOverlay}>
                      <span>🗑️ Eliminada</span>
                    </div>
                  )}
                </div>

                <div className={styles.imageStatusRow}>
                  {optimizing && <span className={styles.imageStatusOptimizing}>Optimizando…</span>}
                  {!optimizing && ready && (
                    <span className={styles.imageStatusReady}>Lista</span>
                  )}
                  {!optimizing && failed && processError && (
                    <span className={styles.imageStatusError}>{processError}</span>
                  )}
                </div>

                <div className={styles.imageActions}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    disabled={optimizing}
                    onChange={(e) => {
                      const picked = e.target.files?.[0]
                      e.target.value = ''
                      if (!picked) return
                      if (!isValidImage(picked)) {
                        setError(field, {
                          type: 'manual',
                          message: 'Formato inválido. Solo JPG, PNG o WEBP',
                        })
                        return
                      }
                      clearErrors(field)
                      void pickPrincipalImage(field, picked)
                    }}
                    className={styles.fileInput}
                    id={`${field}-input`}
                  />
                  <label
                    htmlFor={`${field}-input`}
                    className={`${styles.fileButton} ${optimizing ? styles.fileButtonDisabled : ''}`}
                  >
                    {file || existingUrl ? 'Reemplazar' : 'Seleccionar'}
                  </label>
                </div>

                {errors[field] && (
                  <div className={styles.fieldError}>{errors[field].message}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ✅ SECCIÓN DE FOTOS EXTRAS */}
      <div className={styles.optionalFieldsSection}>
        <h4 className={styles.subsectionTitle}>
          <span className={styles.optionalBadge}>Fotos Opcionales</span>
          <span className={styles.subsectionHint}>
            Hasta {FORM_RULES.MAX_EXTRA_PHOTOS} fotos · JPG, PNG, WEBP · Optimización secuencial en el navegador
          </span>
        </h4>
        
        {/* ✅ FOTOS EXISTENTES (Solo en modo EDIT) */}
        {mode === MODE.EDIT && imageState.existingExtras && imageState.existingExtras.length > 0 && (
          <div className={styles.existingPhotosSection}>
            <h4>Fotos Existentes</h4>
            <div className={styles.existingPhotosGrid}>
              {imageState.existingExtras.map((photo, index) => (
                <div key={index} className={styles.existingPhotoCard}>
                  {photo.remove ? (
                    <div className={styles.removedPhotoPlaceholder}>
                      <div className={styles.removedIcon}>🗑️</div>
                      <span className={styles.removedText}>Marcada para eliminar</span>
                      <button
                        type="button"
                        onClick={() => restoreExistingExtra(index)}
                        className={styles.restoreButton}
                      >
                        ↺ Restaurar
                      </button>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={photo.url} 
                        alt={`Foto existente ${index + 1}`}
                        className={styles.existingPhotoImg}
                      />
                      <div className={styles.existingPhotoActions}>
                        <button
                          type="button"
                          onClick={() => removeExistingExtra(index)}
                          className={styles.removeButton}
                          title="Eliminar esta foto"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ✅ INPUT MÚLTIPLE PARA AGREGAR FOTOS */}
        <div className={styles.multipleInputSection}>
          <h4>{mode === MODE.CREATE ? 'Seleccionar Fotos Extras' : 'Agregar Fotos Nuevas'}</h4>
          
          <div className={styles.multipleInputContainer}>
            <label className={styles.multipleInputLabel}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                disabled={imageState.fotosExtra?.some((x) => x.processStatus === 'optimizing')}
                onChange={(e) => {
                  const files = e.target.files
                  const inputEl = e.target
                  if (files && files.length > 0) {
                    const validFiles = filterValidFiles(files, {
                      maxBytes: null,
                      acceptWebpOnly: false,
                    })
                    if (validFiles.length !== files.length) {
                      setError('fotosExtra', {
                        type: 'manual',
                        message:
                          'Algunas fotos fueron descartadas (solo se permiten JPG, PNG o WEBP)',
                      })
                    } else {
                      clearErrors('fotosExtra')
                    }
                    const capped = validFiles.slice(0, FORM_RULES.MAX_EXTRA_PHOTOS)
                    if (validFiles.length > FORM_RULES.MAX_EXTRA_PHOTOS) {
                      setError('fotosExtra', {
                        type: 'manual',
                        message: `Solo se procesan las primeras ${FORM_RULES.MAX_EXTRA_PHOTOS} fotos`,
                      })
                    }
                    inputEl.value = ''
                    void pickExtraFiles(capped)
                  }
                }}
                className={styles.multipleFileInput}
              />
              <div className={styles.multipleInputUI}>
                <span className={styles.multipleInputIcon}>📁</span>
                <span className={styles.multipleInputText}>
                  {imageState.fotosExtra?.length > 0
                    ? `${imageState.fotosExtra.length} foto(s) · ${
                        imageState.fotosExtra.some((x) => x.processStatus === 'optimizing')
                          ? 'optimizando…'
                          : `${imageState.fotosExtra.filter((x) => x.processStatus === 'ready').length} lista(s)`
                      }`
                    : 'Seleccionar múltiples archivos'}
                </span>
              </div>
            </label>
          </div>
          
          {/* ✅ PREVIEW DE ARCHIVOS NUEVOS */}
          {imageState.fotosExtra && imageState.fotosExtra.length > 0 && (
            <div className={styles.newFilesPreview}>
              <h5>Fotos nuevas:</h5>
              <div className={styles.newFilesGrid}>
                {imageState.fotosExtra.map((item, index) => (
                  <div key={`${item.label}-${index}`} className={styles.newFileCard}>
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={`Nueva foto ${index + 1}`}
                        className={styles.newFileImg}
                      />
                    ) : (
                      <div className={styles.newFilePlaceholder}>
                        {item.processStatus === 'optimizing' ? (
                          <>
                            <span className={styles.imageSpinner} aria-hidden />
                            <span className={styles.newFilePlaceholderText}>Optimizando…</span>
                          </>
                        ) : (
                          <span className={styles.newFilePlaceholderText}>Sin vista previa</span>
                        )}
                      </div>
                    )}
                    <div className={styles.newFileInfo}>
                      <span className={styles.newFileName}>{item.label}</span>
                      {item.processStatus === 'ready' && item.file && (
                        <span className={styles.newFileSize}>
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                      {item.processStatus === 'ready' && (
                        <span className={styles.imageStatusReady}>Lista</span>
                      )}
                      {item.processStatus === 'error' && item.processError && (
                        <span className={styles.imageStatusError}>{item.processError}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {errors.fotosExtra && (
          <div className={styles.fieldError}>
            {errors.fotosExtra.message || errors.fotosExtra}
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN DE DATOS DEL VEHÍCULO */}
      <div className={styles.dataSection}>
        <h3>Datos del Vehículo</h3>
        
        {/* ✅ SUBSECCIÓN: DATOS OBLIGATORIOS */}
        <div className={styles.requiredFieldsSection}>
          <h4 className={styles.subsectionTitle}>
            <span className={styles.requiredBadge}>Obligatorios</span>
            <span className={styles.subsectionHint}>Completa todos estos campos para continuar</span>
          </h4>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <span className={styles.marcaLabel} id="car-form-marca-label">
                Marca *
              </span>
              <Controller
                name="marca"
                control={control}
                rules={{ required: 'Marca es requerida' }}
                render={({ field }) => (
                  <div
                    className={styles.marcaDropdown}
                    ref={marcaDropdownRef}
                  >
                    <button
                      type="button"
                      id="car-form-marca"
                      className={`${styles.input} ${styles.marcaDropdownTrigger}`}
                      aria-haspopup="listbox"
                      aria-expanded={marcaDropdownOpen}
                      aria-labelledby="car-form-marca-label"
                      aria-controls="car-form-marca-listbox"
                      disabled={isLoading}
                      onClick={() => {
                        if (!isLoading) setMarcaDropdownOpen((o) => !o)
                      }}
                    >
                      <span
                        className={
                          field.value
                            ? styles.marcaDropdownValue
                            : styles.marcaDropdownPlaceholder
                        }
                      >
                        {field.value || 'Seleccionar marca'}
                      </span>
                      <span className={styles.marcaDropdownChevron} aria-hidden />
                    </button>
                    {marcaDropdownOpen ? (
                      <div className={styles.marcaDropdownPanel}>
                        <div className={styles.marcaDropdownSearchWrap}>
                          <input
                            ref={marcaSearchInputRef}
                            type="search"
                            className={`${styles.input} ${styles.marcaSearchInput}`}
                            value={marcaSearchQuery}
                            onChange={(e) => setMarcaSearchQuery(e.target.value)}
                            placeholder="Buscar marca…"
                            aria-label="Buscar marca"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.stopPropagation()
                                setMarcaDropdownOpen(false)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <ul
                          id="car-form-marca-listbox"
                          className={styles.marcaDropdownList}
                          role="listbox"
                          aria-labelledby="car-form-marca-label"
                        >
                          <li role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={!field.value}
                              className={styles.marcaDropdownOption}
                              onClick={() => {
                                field.onChange('')
                                field.onBlur()
                                clearErrors('marca')
                                setMarcaDropdownOpen(false)
                              }}
                            >
                              Seleccionar marca
                            </button>
                          </li>
                          {filteredMarcaSelectOptions.length === 0 ? (
                            <li
                              className={styles.marcaDropdownEmpty}
                              role="presentation"
                            >
                              Ninguna marca coincide con tu búsqueda
                            </li>
                          ) : (
                            filteredMarcaSelectOptions.map((m) => (
                              <li key={m} role="presentation">
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={field.value === m}
                                  className={`${styles.marcaDropdownOption} ${
                                    field.value === m ? styles.marcaDropdownOptionActive : ''
                                  }`}
                                  onClick={() => {
                                    field.onChange(m)
                                    field.onBlur()
                                    clearErrors('marca')
                                    setMarcaDropdownOpen(false)
                                  }}
                                >
                                  {m}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              />
              {errors.marca && <span className={styles.error}>{errors.marca.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Modelo *</label>
              <input
                type="text"
                {...register('modelo', { required: 'Modelo es requerido' })}
                className={styles.input}
              />
              {errors.modelo && <span className={styles.error}>{errors.modelo.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Año *</label>
              <input
                type="number"
                {...register('anio', { required: 'Año es requerido' })}
                className={styles.input}
              />
              {errors.anio && <span className={styles.error}>{errors.anio.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Precio *</label>
              <input
                type="number"
                {...register('precio', { required: 'Precio es requerido' })}
                className={styles.input}
              />
              {errors.precio && <span className={styles.error}>{errors.precio.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Kilometraje *</label>
              <input
                type="number"
                {...register('kilometraje', { required: 'Kilometraje es requerido' })}
                className={styles.input}
              />
              {errors.kilometraje && <span className={styles.error}>{errors.kilometraje.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Caja *</label>
              <input
                type="text"
                {...register('caja', { required: 'Caja es requerida' })}
                className={styles.input}
              />
              {errors.caja && <span className={styles.error}>{errors.caja.message}</span>}
            </div>
          </div>
        </div>

        {/* ✅ SUBSECCIÓN: DATOS OPCIONALES */}
        <div className={styles.optionalFieldsSection}>
          <h4 className={styles.subsectionTitle}>
            <span className={styles.optionalBadge}>Opcionales</span>
            <span className={styles.subsectionHint}>Completa para mejorar la información del vehículo</span>
          </h4>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Versión</label>
              <input
                type="text"
                {...register('version')}
                className={styles.input}
              />
              {errors.version && <span className={styles.error}>{errors.version.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Color</label>
              <input
                type="text"
                {...register('color')}
                className={styles.input}
              />
              {errors.color && <span className={styles.error}>{errors.color.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Combustible</label>
              <input
                type="text"
                {...register('combustible')}
                className={styles.input}
              />
              {errors.combustible && <span className={styles.error}>{errors.combustible.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Segmento</label>
              <input
                type="text"
                {...register('segmento')}
                className={styles.input}
              />
              {errors.segmento && <span className={styles.error}>{errors.segmento.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Cilindrada (L)</label>
              <input
                type="text"
                inputMode="decimal"
                onBlur={handleCilindradaBlur}
                {...register('cilindrada', { 
                  pattern: {
                    value: /^[0-9]\.[0-9]$/,
                    message: 'Formato debe ser X.X (ejemplo: 2.0, 3.5)'
                  },
                  validate: {
                    validRange: (value) => {
                      if (!value) return true
                      const num = parseFloat(value)
                      return (num >= 0.5 && num <= 9.9) || 'Debe estar entre 0.5 y 9.9 litros'
                    }
                  }
                })}
                className={styles.input}
              />
              {errors.cilindrada && <span className={styles.error}>{errors.cilindrada.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Tracción</label>
              <input
                type="text"
                {...register('traccion')}
                className={styles.input}
              />
              {errors.traccion && <span className={styles.error}>{errors.traccion.message}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>HP</label>
              <input
                type="number"
                {...register('HP')}
                className={styles.input}
              />
              {errors.HP && <span className={styles.error}>{errors.HP.message}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SECCIÓN OFERTA - Separada visualmente de los datos */}
      <div className={styles.offerSection}>
        <h4 className={styles.offerSectionTitle}>Oferta</h4>
        <div className={styles.offerRow}>
          <label className={styles.offerCheckboxLabel}>
            <input
              type="checkbox"
              {...register('oferta', {
                onChange: (e) => {
                  if (!e.target.checked) setValue('descuento', 0)
                }
              })}
              className={styles.offerCheckbox}
            />
            <span className={styles.offerCheckboxText}>En oferta</span>
          </label>
          <div className={styles.offerInputWrap}>
            <label className={styles.offerInputLabel}>Descuento (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              disabled={!ofertaValue}
              {...register('descuento', {
                min: { value: 0, message: 'Mínimo 0' },
                max: { value: 100, message: 'Máximo 100' },
                valueAsNumber: true
              })}
              className={!ofertaValue ? `${styles.offerInput} ${styles.offerInputDisabled}` : styles.offerInput}
            />
          </div>
        </div>
        {errors.descuento && (
          <div className={styles.offerError}>
            <span className={styles.error}>{errors.descuento.message}</span>
          </div>
        )}
      </div>

      {/* ✅ BOTONES DE ACCIÓN */}
      <div className={styles.actionButtons}>
        {pipelineBlocked && (
          <p className={styles.pipelineWarning} role="status">
            Esperá a que termine la optimización de las imágenes antes de enviar el formulario.
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || pipelineBlocked}
        >
          {isLoading
            ? 'Procesando...'
            : mode === MODE.CREATE
              ? 'Crear Auto'
              : 'Actualizar Auto'}
        </button>
      </div>
    </form>
  )
}

export default CarFormRHF

