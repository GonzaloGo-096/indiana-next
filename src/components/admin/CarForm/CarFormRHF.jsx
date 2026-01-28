/**
 * CarFormRHF - Formulario de autos con React Hook Form
 * 
 * @author Indiana Usados
 * @version 3.0.0 - Next.js compatible
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useImageReducer, IMAGE_FIELDS } from '@/components/admin/hooks/useImageReducer'
import styles from './CarFormRHF.module.css'
import { FORM_RULES } from '@/constants/forms'
import { isValidImage, filterValidFiles } from '@/utils/files'
import { normalizeCilindrada } from '@/utils/formatters'

// ✅ CONSTANTES
const MODE = {
  CREATE: 'create',
  EDIT: 'edit'
}

// ✅ CAMPOS NUMÉRICOS (para coerción automática)
const NUMERIC_FIELDS = ['precio', 'anio', 'kilometraje']

// ✅ PROPS DEL COMPONENTE
const CarFormRHF = ({ 
  mode, 
  initialData = {}, 
  onSubmitFormData,
  isLoading = false,
  onClose
}) => {
  // ✅ HOOK PERSONALIZADO PARA MANEJO DE IMÁGENES
  const {
    imageState,
    initImageState,
    setFile,
    removeImage,
    restoreImage,
    resetImages,
    validateImages,
    buildImageFormData,
    getPreviewFor,
    cleanupObjectUrls,
    setMultipleExtras,
    removeExistingExtra,
    restoreExistingExtra
  } = useImageReducer(mode, initialData)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    reset
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
      HP: ''
    }
  })

  // ✅ INICIALIZAR FORMULARIO CON DATOS INICIALES
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const formData = { ...initialData }
      delete formData.urls // Los URLs se manejan por separado
      
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
    
    // ✅ VALIDAR IMÁGENES SEGÚN MODO
    const imageErrors = validateImages(mode)
    Object.assign(errors, imageErrors)
    return errors
  }, [mode, validateImages])

  // ✅ CONSTRUIR FORMDATA SEGÚN MODO
  const buildVehicleFormData = useCallback((data) => {
    const formData = new FormData()
    
    // ✅ AGREGAR CAMPOS DE DATOS PRIMITIVOS
    Object.entries(data).forEach(([key, value]) => {
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
      <div className={styles.formHeader}>
        <h2>{mode === MODE.CREATE ? 'Crear Nuevo Auto' : 'Editar Auto'}</h2>
        <p>Complete los campos requeridos</p>
      </div>

      {/* ✅ SECCIÓN DE IMÁGENES PRINCIPALES */}
      <div className={styles.requiredFieldsSection}>
        <h4 className={styles.subsectionTitle}>
          <span className={styles.requiredBadge}>Fotos Obligatorias</span>
          <span className={styles.subsectionHint}>Formatos: JPG, PNG, WEBP · Se optimizarán automáticamente</span>
        </h4>
        
        <div className={styles.principalImagesGrid}>
          {IMAGE_FIELDS.principales.map(field => {
            const { file, existingUrl, remove } = imageState[field] || {}
            const preview = getPreviewFor(field)
            
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
                  
                  {remove && (
                    <div className={styles.removedOverlay}>
                      <span>🗑️ Eliminada</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.imageActions}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const isValidType = isValidImage(file)
                        if (!isValidType) {
                          setError(field, { type: 'manual', message: 'Formato inválido. Solo JPG, PNG o WEBP' })
                          return
                        }
                        // ✅ Validación de tamaño eliminada: Sharp optimizará las imágenes en la API Route
                        clearErrors(field)
                        setFile(field, file)
                      }
                    }}
                    className={styles.fileInput}
                    id={`${field}-input`}
                  />
                  <label htmlFor={`${field}-input`} className={styles.fileButton}>
                    {file || existingUrl ? 'Reemplazar' : 'Seleccionar'}
                  </label>
                </div>
                
                {errors[field] && (
                  <div className={styles.fieldError}>
                    {errors[field].message}
                  </div>
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
          <span className={styles.subsectionHint}>Hasta {FORM_RULES.MAX_EXTRA_PHOTOS} fotos · JPG, PNG, WEBP · Se optimizarán automáticamente</span>
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
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) {
                    // ✅ Validación de tamaño eliminada: Sharp optimizará las imágenes en la API Route
                    const validFiles = filterValidFiles(files, {
                      maxBytes: null, // Sin límite de tamaño
                      acceptWebpOnly: false
                    })
                    if (validFiles.length !== files.length) {
                      setError('fotosExtra', { type: 'manual', message: 'Algunas fotos fueron descartadas (solo se permiten JPG, PNG o WEBP)' })
                    } else {
                      clearErrors('fotosExtra')
                    }
                    setMultipleExtras(validFiles)
                  }
                }}
                className={styles.multipleFileInput}
              />
              <div className={styles.multipleInputUI}>
                <span className={styles.multipleInputIcon}>📁</span>
                <span className={styles.multipleInputText}>
                  {imageState.fotosExtra?.length > 0 
                    ? `${imageState.fotosExtra.length} archivo(s) seleccionado(s)`
                    : 'Seleccionar múltiples archivos'
                  }
                </span>
              </div>
            </label>
          </div>
          
          {/* ✅ PREVIEW DE ARCHIVOS NUEVOS */}
          {imageState.fotosExtra && imageState.fotosExtra.length > 0 && (
            <div className={styles.newFilesPreview}>
              <h5>Archivos Nuevos:</h5>
              <div className={styles.newFilesGrid}>
                {imageState.fotosExtra.map((file, index) => (
                  <div key={index} className={styles.newFileCard}>
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Nuevo archivo ${index + 1}`}
                      className={styles.newFileImg}
                    />
                    <div className={styles.newFileInfo}>
                      <span className={styles.newFileName}>{file.name}</span>
                      <span className={styles.newFileSize}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
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
              <label>Marca *</label>
              <input
                type="text"
                {...register('marca', { required: 'Marca es requerida' })}
                className={styles.input}
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

      {/* ✅ BOTONES DE ACCIÓN */}
      <div className={styles.actionButtons}>
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
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : (mode === MODE.CREATE ? 'Crear Auto' : 'Actualizar Auto')}
        </button>
      </div>
    </form>
  )
}

export default CarFormRHF

