/**
 * useImageReducer.js - Estado de imágenes del admin con optimización en cliente
 *
 * @author Indiana Usados
 * @version 3.0.0 - Optimización cliente + previews gestionados
 */

'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { FORM_RULES } from '@/constants/forms'
import { clientImageOptimize } from '@/utils/clientImageOptimize'

const logoChicoDefault = '/assets/logos/logos-indiana/desktop/logo-chico-solid.webp'

export const IMAGE_FIELDS = {
  principales: ['fotoPrincipal', 'fotoHover'],
}

export const ALL_IMAGE_FIELDS = [...IMAGE_FIELDS.principales]

const LEGACY_EXTRA_FIELDS = [
  'fotoExtra1',
  'fotoExtra2',
  'fotoExtra3',
  'fotoExtra4',
  'fotoExtra5',
  'fotoExtra6',
  'fotoExtra7',
  'fotoExtra8',
]

export const IMAGE_ACTIONS = {
  INIT_CREATE: 'INIT_CREATE',
  INIT_EDIT: 'INIT_EDIT',
  REMOVE_IMAGE: 'REMOVE_IMAGE',
  RESTORE_PRINCIPAL_UPLOAD: 'RESTORE_PRINCIPAL_UPLOAD',
  RESET: 'RESET',
  REMOVE_EXISTING_EXTRA: 'REMOVE_EXISTING_EXTRA',
  RESTORE_EXISTING_EXTRA: 'RESTORE_EXISTING_EXTRA',
  SET_DEFAULT_IMAGES: 'SET_DEFAULT_IMAGES',
  PRINCIPAL_OPTIMIZE_START: 'PRINCIPAL_OPTIMIZE_START',
  PRINCIPAL_OPTIMIZE_SUCCESS: 'PRINCIPAL_OPTIMIZE_SUCCESS',
  PRINCIPAL_OPTIMIZE_ERROR: 'PRINCIPAL_OPTIMIZE_ERROR',
  EXTRAS_SET_ALL: 'EXTRAS_SET_ALL',
}

/** @typedef {'idle' | 'optimizing' | 'ready' | 'error'} ImageProcessStatus */

function createEmptyPrincipalSlot() {
  return {
    existingUrl: '',
    publicId: '',
    originalName: '',
    file: null,
    remove: false,
    processStatus: 'idle',
    processError: null,
    previewUrl: null,
  }
}

function createInitialImageState() {
  const state = {
    existingExtras: [],
    fotosExtra: [],
  }
  ALL_IMAGE_FIELDS.forEach((key) => {
    state[key] = createEmptyPrincipalSlot()
  })
  return state
}

/**
 * Revoca todas las object URLs de un snapshot de estado (sin mutar estado).
 * @param {ReturnType<typeof createInitialImageState>} st
 */
export function revokePreviewUrlsInState(st) {
  if (!st) return
  ALL_IMAGE_FIELDS.forEach((key) => {
    const u = st[key]?.previewUrl
    if (u) {
      try {
        URL.revokeObjectURL(u)
      } catch {
        /* ignore */
      }
    }
  })
  ;(st.fotosExtra || []).forEach((item) => {
    if (item?.previewUrl) {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {
        /* ignore */
      }
    }
  })
}

/**
 * true si alguna imagen está optimizando (bloquea submit).
 * @param {ReturnType<typeof createInitialImageState>} state
 */
export function isImagePipelineBlocked(state) {
  if (!state) return false
  for (const key of ALL_IMAGE_FIELDS) {
    if (state[key]?.processStatus === 'optimizing') return true
  }
  for (const item of state.fotosExtra || []) {
    if (item?.processStatus === 'optimizing') return true
  }
  return false
}

function imageReducer(state, action) {
  switch (action.type) {
    case IMAGE_ACTIONS.INIT_CREATE:
      return createInitialImageState()

    case IMAGE_ACTIONS.INIT_EDIT: {
      const { urls = {} } = action.payload
      const editState = {
        existingExtras: [],
        fotosExtra: [],
      }

      ALL_IMAGE_FIELDS.forEach((key) => {
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
          publicId,
          originalName,
          file: null,
          remove: false,
          processStatus: 'idle',
          processError: null,
          previewUrl: null,
        }
      })

      LEGACY_EXTRA_FIELDS.forEach((fieldKey) => {
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
              url,
              publicId,
              originalName,
              remove: false,
            })
          }
        }
      })

      return editState
    }

    case IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_START: {
      const { key } = action.payload
      return {
        ...state,
        [key]: {
          ...state[key],
          file: null,
          previewUrl: null,
          processStatus: 'optimizing',
          processError: null,
        },
      }
    }

    case IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_SUCCESS: {
      const { key, file, previewUrl } = action.payload
      return {
        ...state,
        [key]: {
          ...state[key],
          file,
          previewUrl,
          processStatus: 'ready',
          processError: null,
          remove: false,
        },
      }
    }

    case IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_ERROR: {
      const { key, message } = action.payload
      return {
        ...state,
        [key]: {
          ...state[key],
          file: null,
          previewUrl: null,
          processStatus: 'error',
          processError: message,
        },
      }
    }

    case IMAGE_ACTIONS.REMOVE_IMAGE: {
      const { key: removeKey } = action.payload
      return {
        ...state,
        [removeKey]: {
          ...state[removeKey],
          file: null,
          previewUrl: null,
          remove: true,
          processStatus: 'idle',
          processError: null,
        },
      }
    }

    case IMAGE_ACTIONS.RESTORE_PRINCIPAL_UPLOAD: {
      const { key } = action.payload
      return {
        ...state,
        [key]: {
          ...state[key],
          file: null,
          previewUrl: null,
          remove: false,
          processStatus: 'idle',
          processError: null,
        },
      }
    }

    case IMAGE_ACTIONS.EXTRAS_SET_ALL:
      return {
        ...state,
        fotosExtra: action.payload.items || [],
      }

    case IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA: {
      const { index } = action.payload
      const existingExtras = [...state.existingExtras]
      if (existingExtras[index]) {
        existingExtras[index] = {
          ...existingExtras[index],
          remove: true,
        }
      }
      return { ...state, existingExtras }
    }

    case IMAGE_ACTIONS.RESTORE_EXISTING_EXTRA: {
      const { index: restoreIndex } = action.payload
      const existingExtrasToRestore = [...state.existingExtras]
      if (existingExtrasToRestore[restoreIndex]) {
        existingExtrasToRestore[restoreIndex] = {
          ...existingExtrasToRestore[restoreIndex],
          remove: false,
        }
      }
      return { ...state, existingExtras: existingExtrasToRestore }
    }

    case IMAGE_ACTIONS.RESET:
      return createInitialImageState()

    case IMAGE_ACTIONS.SET_DEFAULT_IMAGES: {
      const { file, previewUrlPrincipal, previewUrlHover } = action.payload
      return {
        ...state,
        fotoPrincipal: {
          ...state.fotoPrincipal,
          file,
          remove: false,
          processStatus: 'ready',
          processError: null,
          previewUrl: previewUrlPrincipal,
        },
        fotoHover: {
          ...state.fotoHover,
          file,
          remove: false,
          processStatus: 'ready',
          processError: null,
          previewUrl: previewUrlHover,
        },
      }
    }

    default:
      return state
  }
}

const fetchImageAsFile = async (imageUrl, fileName = 'logo-chico_solid.webp') => {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const blob = await response.blob()
    return new File([blob], fileName, { type: 'image/webp' })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[image:fetchImageAsFile]', error.message)
    }
    return null
  }
}

export const useImageReducer = (mode, initialData = {}) => {
  const [imageState, dispatch] = useReducer(imageReducer, {}, () => {
    if (mode === 'edit' && initialData.urls) {
      return imageReducer(undefined, {
        type: IMAGE_ACTIONS.INIT_EDIT,
        payload: initialData,
      })
    }
    return createInitialImageState()
  })

  const stateRef = useRef(imageState)

  const defaultImagesLoaded = useRef(false)
  const principalPickGen = useRef({ fotoPrincipal: 0, fotoHover: 0 })
  const extrasBatchGen = useRef(0)

  useEffect(() => {
    stateRef.current = imageState
  }, [imageState])

  useEffect(() => {
    if (mode !== 'create' || defaultImagesLoaded.current) {
      return
    }
    defaultImagesLoaded.current = true

    const loadDefaultImages = async () => {
      const defaultFile = await fetchImageAsFile(logoChicoDefault, 'logo-chico_solid.webp')
      if (defaultFile) {
        const previewUrlPrincipal = URL.createObjectURL(defaultFile)
        const previewUrlHover = URL.createObjectURL(defaultFile)
        dispatch({
          type: IMAGE_ACTIONS.SET_DEFAULT_IMAGES,
          payload: { file: defaultFile, previewUrlPrincipal, previewUrlHover },
        })
      }
    }

    loadDefaultImages()
  }, [mode])

  const initImageState = useCallback((newMode, newInitialData = {}) => {
    revokePreviewUrlsInState(stateRef.current)
    if (newMode === 'create') {
      dispatch({ type: IMAGE_ACTIONS.INIT_CREATE })
      defaultImagesLoaded.current = false
    } else if (newMode === 'edit') {
      dispatch({
        type: IMAGE_ACTIONS.INIT_EDIT,
        payload: newInitialData,
      })
    }
  }, [])

  const pickPrincipalImage = useCallback(async (key, rawFile) => {
    principalPickGen.current[key] = (principalPickGen.current[key] || 0) + 1
    const gen = principalPickGen.current[key]
    const slot = stateRef.current[key]
    if (slot?.previewUrl) {
      try {
        URL.revokeObjectURL(slot.previewUrl)
      } catch {
        /* ignore */
      }
    }
    dispatch({ type: IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_START, payload: { key } })
    try {
      const optimized = await clientImageOptimize(rawFile)
      if (principalPickGen.current[key] !== gen) return
      const previewUrl = URL.createObjectURL(optimized)
      dispatch({
        type: IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_SUCCESS,
        payload: { key, file: optimized, previewUrl },
      })
    } catch (err) {
      if (principalPickGen.current[key] !== gen) return
      dispatch({
        type: IMAGE_ACTIONS.PRINCIPAL_OPTIMIZE_ERROR,
        payload: {
          key,
          message: err?.message || 'No se pudo optimizar la imagen',
        },
      })
    }
  }, [])

  const removeImage = useCallback((key) => {
    const slot = stateRef.current[key]
    if (slot?.previewUrl) {
      try {
        URL.revokeObjectURL(slot.previewUrl)
      } catch {
        /* ignore */
      }
    }
    dispatch({ type: IMAGE_ACTIONS.REMOVE_IMAGE, payload: { key } })
  }, [])

  const restoreImage = useCallback((key) => {
    const slot = stateRef.current[key]
    if (slot?.previewUrl) {
      try {
        URL.revokeObjectURL(slot.previewUrl)
      } catch {
        /* ignore */
      }
    }
    dispatch({ type: IMAGE_ACTIONS.RESTORE_PRINCIPAL_UPLOAD, payload: { key } })
  }, [])

  const resetImages = useCallback(() => {
    revokePreviewUrlsInState(stateRef.current)
    dispatch({ type: IMAGE_ACTIONS.RESET })
    defaultImagesLoaded.current = false
  }, [])

  const pickExtraFiles = useCallback(async (rawFiles) => {
    const batchId = (extrasBatchGen.current += 1)
    const arr = Array.from(rawFiles || [])

    ;(stateRef.current.fotosExtra || []).forEach((item) => {
      if (item?.previewUrl) {
        try {
          URL.revokeObjectURL(item.previewUrl)
        } catch {
          /* ignore */
        }
      }
    })

    if (arr.length === 0) {
      dispatch({ type: IMAGE_ACTIONS.EXTRAS_SET_ALL, payload: { items: [] } })
      return
    }

    const placeholders = arr.map((f) => ({
      label: f.name,
      file: null,
      processStatus: 'optimizing',
      processError: null,
      previewUrl: null,
    }))
    dispatch({ type: IMAGE_ACTIONS.EXTRAS_SET_ALL, payload: { items: placeholders } })

    const next = [...placeholders]
    for (let i = 0; i < arr.length; i += 1) {
      if (extrasBatchGen.current !== batchId) return
      try {
        const optimized = await clientImageOptimize(arr[i])
        if (extrasBatchGen.current !== batchId) return
        const previewUrl = URL.createObjectURL(optimized)
        next[i] = {
          file: optimized,
          processStatus: 'ready',
          processError: null,
          previewUrl,
          label: optimized.name,
        }
      } catch (err) {
        next[i] = {
          file: null,
          processStatus: 'error',
          processError: err?.message || 'No se pudo optimizar la imagen',
          previewUrl: null,
          label: arr[i].name,
        }
      }
      dispatch({
        type: IMAGE_ACTIONS.EXTRAS_SET_ALL,
        payload: { items: next.map((x) => ({ ...x })) },
      })
    }
  }, [])

  const removeExistingExtra = useCallback((index) => {
    dispatch({ type: IMAGE_ACTIONS.REMOVE_EXISTING_EXTRA, payload: { index } })
  }, [])

  const restoreExistingExtra = useCallback((index) => {
    dispatch({ type: IMAGE_ACTIONS.RESTORE_EXISTING_EXTRA, payload: { index } })
  }, [])

  const validateImages = useCallback(
    (formMode) => {
      const errors = {}

      const principalBlocked = (field) => {
        const slot = imageState[field] || {}
        if (slot.processStatus === 'optimizing') {
          return 'Esperá a que termine la optimización'
        }
        if (slot.processStatus === 'error') {
          return slot.processError || 'Error al optimizar la imagen'
        }
        return null
      }

      if (formMode === 'create') {
        IMAGE_FIELDS.principales.forEach((field) => {
          const msg = principalBlocked(field)
          if (msg) {
            errors[field] = msg
            return
          }
          const slot = imageState[field] || {}
          if (!slot.file || slot.processStatus !== 'ready') {
            errors[field] = `La ${field} es requerida`
          }
        })

        const extras = imageState.fotosExtra || []
        const optimizing = extras.some((x) => x.processStatus === 'optimizing')
        const hasErr = extras.some((x) => x.processStatus === 'error')
        const readyCount = extras.filter((x) => x.processStatus === 'ready').length

        if (optimizing) {
          errors.fotosExtra = 'Esperá a que terminen de optimizarse las fotos extra'
        } else if (hasErr) {
          errors.fotosExtra = 'Reemplazá las fotos extra con error (volvé a seleccionar archivos)'
        } else if (readyCount > FORM_RULES.MAX_EXTRA_PHOTOS) {
          errors.fotosExtra = `Máximo ${FORM_RULES.MAX_EXTRA_PHOTOS} fotos extras permitidas`
        }
      } else {
        for (const field of IMAGE_FIELDS.principales) {
          const msg = principalBlocked(field)
          if (msg) {
            errors[field] = msg
          }
        }
        const extras = imageState.fotosExtra || []
        if (extras.some((x) => x.processStatus === 'optimizing')) {
          errors.fotos = 'Esperá a que terminen de optimizarse las fotos nuevas'
        } else if (extras.some((x) => x.processStatus === 'error')) {
          errors.fotos = 'Reemplazá las fotos nuevas con error (volvé a seleccionar archivos)'
        }

        const slotP = imageState.fotoPrincipal || {}
        const slotH = imageState.fotoHover || {}
        const hasFotoPrincipal =
          (slotP.existingUrl && !slotP.remove) || (slotP.file && slotP.processStatus === 'ready')
        const hasFotoHover =
          (slotH.existingUrl && !slotH.remove) || (slotH.file && slotH.processStatus === 'ready')

        if (!hasFotoPrincipal && !hasFotoHover) {
          errors.fotos = errors.fotos || 'Debe mantener al menos 1 foto principal o reemplazarla'
        }
      }

      return errors
    },
    [imageState]
  )

  const buildImageFormData = useCallback(
    (formData) => {
      IMAGE_FIELDS.principales.forEach((key) => {
        const slot = imageState[key] || {}
        if (slot.processStatus === 'ready' && slot.file) {
          formData.append(key, slot.file)
        }
      })

      const extras = imageState.fotosExtra || []
      extras.forEach((item) => {
        if (item.processStatus === 'ready' && item.file) {
          formData.append('fotosExtra', item.file)
        }
      })

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
    },
    [imageState]
  )

  const getPreviewFor = useCallback(
    (key) => {
      const slot = imageState[key] || {}
      if (slot.remove) return null
      if (slot.previewUrl) return slot.previewUrl
      if (slot.existingUrl) return slot.existingUrl
      return null
    },
    [imageState]
  )

  const cleanupObjectUrls = useCallback(() => {
    revokePreviewUrlsInState(stateRef.current)
  }, [])

  return {
    imageState,
    initImageState,
    pickPrincipalImage,
    removeImage,
    restoreImage,
    resetImages,
    validateImages,
    buildImageFormData,
    getPreviewFor,
    cleanupObjectUrls,
    pickExtraFiles,
    removeExistingExtra,
    restoreExistingExtra,
  }
}
