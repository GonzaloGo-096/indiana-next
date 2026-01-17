/**
 * useImageReducer.js - Hook personalizado para manejar estado de imágenes
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

'use client'

import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react'
import { FORM_RULES } from '@/constants/forms'

// ✅ IMAGEN PREDETERMINADA - Ruta pública (funciona en local y producción)
const logoChicoDefault = '/assets/logos/logos-indiana/desktop/logo-chico-solid.webp'

// ✅ CAMPOS DE IMAGEN (estructura actualizada)
export const IMAGE_FIELDS = {
  principales: ['fotoPrincipal', 'fotoHover']
}

// ✅ CAMPOS INDIVIDUALES (solo principales)
export const ALL_IMAGE_FIELDS = [
  ...IMAGE_FIELDS.principales
]

// ✅ CAMPOS LEGACY PARA CARGAR FOTOS EXISTENTES DEL BACKEND
const LEGACY_EXTRA_FIELDS = ['fotoExtra1', 'fotoExtra2', 'fotoExtra3', 'fotoExtra4', 'fotoExtra5', 'fotoExtra6', 'fotoExtra7', 'fotoExtra8']

// ✅ ACCIONES DEL REDUCER DE IMÁGENES
export const IMAGE_ACTIONS = {
  INIT_CREATE: 'INIT_CREATE',
  INIT_EDIT: 'INIT_EDIT',
  SET_FILE: 'SET_FILE',
  REMOVE_IMAGE: 'REMOVE_IMAGE',
  RESET: 'RESET',
  SET_MULTIPLE_EXTRAS: 'SET_MULTIPLE_EXTRAS',
  REMOVE_EXISTING_EXTRA: 'REMOVE_EXISTING_EXTRA',
  RESTORE_EXISTING_EXTRA: 'RESTORE_EXISTING_EXTRA',
  SET_DEFAULT_IMAGES: 'SET_DEFAULT_IMAGES'
}

// ✅ ESTADO INICIAL PARA UNA IMAGEN
const createEmptyImageState = () => ({
  existingUrl: '',
  publicId: '',
  originalName: '',
  file: null,
  remove: false
})

// ✅ ESTADO INICIAL PARA TODAS LAS IMÁGENES
const createInitialImageState = () => {
  const state = {
    existingExtras: [],
    fotosExtra: []
  }
  
  ALL_IMAGE_FIELDS.forEach(key => {
    state[key] = createEmptyImageState()
  })
  
  return state
}

// ✅ REDUCER PARA MANEJO DE IMÁGENES
const imageReducer = (state, action) => {
  switch (action.type) {
    case IMAGE_ACTIONS.INIT_CREATE:
      return createInitialImageState()
      
    case IMAGE_ACTIONS.INIT_EDIT:
      const { urls = {} } = action.payload
      const editState = {
        existingExtras: [],
        fotosExtra: []
      }
      
      // ✅ PROCESAR IMÁGENES PRINCIPALES
      ALL_IMAGE_FIELDS.forEach(key => {
        const imageData = urls[key]
        let url = ''
        let publicId = ''
        let originalName = ''
        
        if (imageData) {
          if (typeof imageData === 'string') {
            url = imageData
          } else if (typeof imageData === 'object') {
            url = imageData.url || imageData.secure_url || ''
            publicId = imageData.public_id || ''
            originalName = imageData.original_name || ''
          }
        }
        
        editState[key] = {
          existingUrl: url,
          publicId: publicId,
          originalName: originalName,
          file: null,
          remove: false
        }
      })
      
      // ✅ PROCESAR FOTOS EXTRAS - Cargar como array de existentes
      LEGACY_EXTRA_FIELDS.forEach(fieldKey => {
        const imageData = urls[fieldKey]
        if (imageData) {
          let url = ''
          let publicId = ''
          let originalName = ''
          
          if (typeof imageData === 'string') {
            url = imageData
          } else if (typeof imageData === 'object') {
            url = imageData.url || imageData.secure_url || ''
            publicId = imageData.public_id || ''
            originalName = imageData.original_name || ''
          }
          
          if (url) {
            editState.existingExtras.push({
              url: url,
              publicId: publicId,
              originalName: originalName,
              remove: false
            })
          }
        }
      })
      
      return editState
      
    case IMAGE_ACTIONS.SET_FILE:
      const { key, file } = action.payload
      return {
        ...state,
        [key]: {
          ...state[key],
          file,
          remove: false
        }
      }
      
    case IMAGE_ACTIONS.REMOVE_IMAGE:
      const { key: removeKey } = action.payload
      return {
        ...state,
        [removeKey]: {
          ...state[removeKey],
          file: null,
          remove: true
        }
      }
      
    case IMAGE_ACTIONS.SET_MULTIPLE_EXTRAS:
      const { files } = action.payload
      return {
        ...state,
        fotosExtra: files || []
      }
      
    case IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA:
      const { index } = action.payload
      const existingExtras = [...state.existingExtras]
      
      if (existingExtras[index]) {
        existingExtras[index] = {
          ...existingExtras[index],
          remove: true
        }
      }
      
      return {
        ...state,
        existingExtras
      }
      
    case IMAGE_ACTIONS.RESTORE_EXISTING_EXTRA:
      const { index: restoreIndex } = action.payload
      const existingExtrasToRestore = [...state.existingExtras]
      
      if (existingExtrasToRestore[restoreIndex]) {
        existingExtrasToRestore[restoreIndex] = {
          ...existingExtrasToRestore[restoreIndex],
          remove: false
        }
      }
      
      return {
        ...state,
        existingExtras: existingExtrasToRestore
      }
      
    case IMAGE_ACTIONS.RESET:
      return createInitialImageState()
      
    case IMAGE_ACTIONS.SET_DEFAULT_IMAGES:
      const { defaultFile } = action.payload
      return {
        ...state,
        fotoPrincipal: {
          ...state.fotoPrincipal,
          file: defaultFile,
          remove: false
        },
        fotoHover: {
          ...state.fotoHover,
          file: defaultFile,
          remove: false
        }
      }
      
    default:
      return state
  }
}

// ✅ FUNCIÓN HELPER: Convierte URL de imagen a File object
const fetchImageAsFile = async (imageUrl, fileName = 'logo-chico_solid.webp') => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[image:fetchImageAsFile] Iniciando fetch', { imageUrl })
    }
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const file = new File([blob], fileName, { type: 'image/webp' })
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[image:fetchImageAsFile] Imagen convertida exitosamente', {
        name: file.name,
        size: file.size,
        type: file.type
      })
    }
    
    return file
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[image:fetchImageAsFile] Error cargando imagen predeterminada', {
        error: error.message,
        imageUrl,
        stack: error.stack
      })
    }
    return null
  }
}

// ✅ HOOK PRINCIPAL
export const useImageReducer = (mode, initialData = {}) => {
  const [imageState, dispatch] = useReducer(imageReducer, {}, () => {
    if (mode === 'edit' && initialData.urls) {
      return imageReducer(undefined, { 
        type: IMAGE_ACTIONS.INIT_EDIT, 
        payload: initialData 
      })
    }
    return createInitialImageState()
  })
  
  // ✅ REFERENCIA PARA EVITAR DOBLE CARGA
  const defaultImagesLoaded = useRef(false)

  // ✅ CARGAR IMÁGENES PREDETERMINADAS EN MODO CREATE
  useEffect(() => {
    if (mode !== 'create' || defaultImagesLoaded.current) {
      return
    }
    
    defaultImagesLoaded.current = true
    
    const loadDefaultImages = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[image:loadDefaultImages] Iniciando carga de imagen predeterminada', {
          mode,
          imageUrl: logoChicoDefault
        })
      }
      
      const defaultFile = await fetchImageAsFile(logoChicoDefault, 'logo-chico_solid.webp')
      
      if (defaultFile) {
        dispatch({ 
          type: IMAGE_ACTIONS.SET_DEFAULT_IMAGES, 
          payload: { defaultFile } 
        })
        if (process.env.NODE_ENV === 'development') {
          console.debug('[image:loadDefaultImages] ✅ Imagen predeterminada cargada')
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[image:loadDefaultImages] ⚠️ No se pudo cargar la imagen predeterminada')
        }
      }
    }
    
    loadDefaultImages()
  }, [mode])

  // ✅ INICIALIZAR ESTADO SEGÚN MODO
  const initImageState = useCallback((newMode, newInitialData = {}) => {
    if (newMode === 'create') {
      dispatch({ type: IMAGE_ACTIONS.INIT_CREATE })
    } else if (newMode === 'edit') {
      dispatch({ 
        type: IMAGE_ACTIONS.INIT_EDIT, 
        payload: newInitialData 
      })
    }
  }, [])

  // ✅ MANEJADORES DE IMÁGENES
  const setFile = useCallback((key, file) => {
    dispatch({ type: IMAGE_ACTIONS.SET_FILE, payload: { key, file } })
  }, [])

  const removeImage = useCallback((key) => {
    dispatch({ type: IMAGE_ACTIONS.REMOVE_IMAGE, payload: { key } })
  }, [])

  const restoreImage = useCallback((key) => {
    dispatch({ 
      type: IMAGE_ACTIONS.SET_FILE, 
      payload: { key, file: null }
    })
  }, [])

  const resetImages = useCallback(() => {
    dispatch({ type: IMAGE_ACTIONS.RESET })
  }, [])

  const setMultipleExtras = useCallback((files) => {
    const filesArray = Array.from(files || [])
    dispatch({ type: IMAGE_ACTIONS.SET_MULTIPLE_EXTRAS, payload: { files: filesArray } })
  }, [])

  const removeExistingExtra = useCallback((index) => {
    dispatch({ type: IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA, payload: { index } })
  }, [])

  const restoreExistingExtra = useCallback((index) => {
    dispatch({ type: IMAGE_ACTIONS.RESTORE_EXISTING_EXTRA, payload: { index } })
  }, [])

  // ✅ VALIDACIÓN DE IMÁGENES
  const validateImages = useCallback((mode) => {
    const errors = {}

    if (mode === 'create') {
      IMAGE_FIELDS.principales.forEach(field => {
        const { file } = imageState[field] || {}
        if (!file) {
          errors[field] = `La ${field} es requerida`
        }
      })

      const fotosExtraCount = imageState.fotosExtra?.length || 0
      
      if (fotosExtraCount > FORM_RULES.MAX_EXTRA_PHOTOS) {
        errors.fotosExtra = `Máximo ${FORM_RULES.MAX_EXTRA_PHOTOS} fotos extras permitidas`
      }
    } else {
      const hasFotoPrincipal = 
        (imageState.fotoPrincipal?.existingUrl && !imageState.fotoPrincipal?.remove) ||
        imageState.fotoPrincipal?.file
      
      const hasFotoHover = 
        (imageState.fotoHover?.existingUrl && !imageState.fotoHover?.remove) ||
        imageState.fotoHover?.file
      
      if (!hasFotoPrincipal && !hasFotoHover) {
        errors.fotos = 'Debe mantener al menos 1 foto principal o reemplazarla'
      }
    }

    return errors
  }, [imageState])

  // ✅ CONSTRUIR FORMDATA PARA IMÁGENES
  const buildImageFormData = useCallback((formData) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[image:buildImageFormData] Construyendo FormData')
    }
    
    // ✅ PRINCIPALES
    IMAGE_FIELDS.principales.forEach(key => {
      const { file } = imageState[key] || {}
      if (file) {
        formData.append(key, file)
      }
    })
    
    // ✅ FOTOS EXTRAS
    const extraFiles = []
    
    if (imageState.fotosExtra && imageState.fotosExtra.length > 0) {
      extraFiles.push(...imageState.fotosExtra)
    }
    
    if (extraFiles.length > 0) {
      extraFiles.forEach(file => {
        formData.append('fotosExtra', file)
      })
    }
    
    // ✅ IDs DE FOTOS A ELIMINAR (solo en modo edit)
    const publicIdsToDelete = []
    if (imageState.existingExtras) {
      imageState.existingExtras.forEach((existingPhoto) => {
        if (existingPhoto.remove && existingPhoto.publicId) {
          publicIdsToDelete.push(existingPhoto.publicId)
        }
      })
    }
    
    if (publicIdsToDelete.length > 0) {
      formData.append('fotosExtraToDelete', JSON.stringify(publicIdsToDelete))
    }
    
    return formData
  }, [imageState])

  // ✅ OBTENER PREVIEW PARA UNA IMAGEN
  const getPreviewFor = useCallback((key) => {
    const { file, existingUrl, remove } = imageState[key] || {}
    
    if (remove) return null
    
    if (file) {
      try {
        return URL.createObjectURL(file)
      } catch (_) {
        return null
      }
    }
    
    return existingUrl || null
  }, [imageState])

  // ✅ LIMPIAR OBJETOS URL CREADOS
  const cleanupObjectUrls = useCallback(() => {
    ALL_IMAGE_FIELDS.forEach(key => {
      const { file } = imageState[key] || {}
      if (file) {
        try {
          URL.revokeObjectURL(URL.createObjectURL(file))
        } catch (_) {
          // Ignorar errores de limpieza
        }
      }
    })
    
    if (imageState.fotosExtra && imageState.fotosExtra.length > 0) {
      imageState.fotosExtra.forEach(file => {
        try {
          const url = URL.createObjectURL(file)
          URL.revokeObjectURL(url)
        } catch (_) {
          // Ignorar errores de limpieza
        }
      })
    }
  }, [imageState])

  return {
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
  }
}

