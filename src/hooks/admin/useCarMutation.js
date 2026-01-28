/**
 * useCarMutation - Hook ultra-optimizado con React Query mutations
 * 
 * ✅ REFACTORIZADO v6.0.0: Versión Next.js compatible
 * 
 * @author Indiana Usados
 * @version 6.0.0 - Next.js compatible
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AUTH_CONFIG } from '@/config/auth'
import vehiclesAdminService from '@/lib/services/vehiclesAdminService'
import { addDirtyVehicleId } from '@/utils/dirtyVehicleIds'

// ✅ HELPER: Obtener token de autorización
const getAuthToken = () => {
  try {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
    return token
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[cars:mutation] Error al obtener token', error)
    }
    return null
  }
}

// ✅ HELPER: Manejo de errores unificado
const handleMutationError = (error, operation) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[cars:mutation] Error al ${operation}`, { 
      message: error.message, 
      status: error.response?.status 
    })
  }
  
  let errorMessage = `Error desconocido al ${operation}`
  
  if (error.message.includes('token de autorización')) {
    errorMessage = '❌ Error de autorización: No se encontró token válido'
  } else if (error.response?.status === 401) {
    errorMessage = '🔐 Error de autorización: Token inválido o expirado'
  } else if (error.response?.status === 403) {
    errorMessage = '🚫 Error de permisos: No tienes acceso a este recurso'
  } else if (error.response?.status === 404) {
    errorMessage = `❌ Vehículo no encontrado`
  } else if (error.response?.status === 400) {
    if (error.response.data?.message) {
      errorMessage = `❌ Error de validación: ${error.response.data.message}`
    } else if (error.response.data?.error) {
      errorMessage = `❌ Error del backend: ${error.response.data.error}`
    } else {
      errorMessage = '❌ Error 400: Datos enviados no son válidos'
    }
  } else if (error.response?.data?.message) {
    errorMessage = error.response.data.message
  } else if (error.response?.data?.error) {
    errorMessage = error.response.data.error
  } else if (error.message) {
    errorMessage = error.message
  }
  
  return errorMessage
}

export const useCarMutation = () => {
  const queryClient = useQueryClient()
  
  // ✅ MUTATION: Crear vehículo (envía FormData tal cual)
  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('❌ No se encontró token de autorización')
      }
      if (!(formData instanceof FormData)) {
        throw new Error('Payload inválido: se esperaba FormData')
      }
      // Log de depuración solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        let fileCount = 0
        for (const [, value] of formData.entries()) {
          if (value instanceof File) fileCount++
        }
        console.debug('[cars:mutation] create: enviando FormData', { 
          fieldsApprox: [...formData.keys()].length, 
          fileCount 
        })
      }
      
      const response = await vehiclesAdminService.createVehicle(formData)
      // ✅ response ya es el JSON parseado (no tiene .data)
      return response
    },
    onSuccess: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.info('[cars:mutation] Vehículo creado exitosamente')
      }
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      
      // ✅ TRACKEAR ID PARA REVALIDACIÓN MANUAL
      // El backend retorna el vehículo creado con _id
      const vehicleId = data?._id || data?.id || data?.vehicle?._id || data?.vehicle?.id
      if (vehicleId) {
        addDirtyVehicleId(vehicleId)
        if (process.env.NODE_ENV === 'development') {
          console.debug('[cars:mutation] ID trackeado para revalidación:', vehicleId)
        }
      }
    },
    onError: (error) => {
      const msg = handleMutationError(error, 'crear')
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[cars:mutation] onError create: ${msg}`)
      }
    }
  })
  
  // ✅ MUTATION: Actualizar vehículo (envía FormData tal cual)
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('❌ No se encontró token de autorización')
      }
      if (!(formData instanceof FormData)) {
        throw new Error('Payload inválido: se esperaba FormData')
      }
      // Log de depuración solo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        let fileCount = 0
        for (const [, value] of formData.entries()) {
          if (value instanceof File) fileCount++
        }
        console.debug('[cars:mutation] update: enviando FormData', { 
          id, 
          fieldsApprox: [...formData.keys()].length, 
          fileCount 
        })
      }
      const response = await vehiclesAdminService.updateVehicle(id, formData)
      // ✅ response ya es el JSON parseado (no tiene .data)
      return response
    },
    onSuccess: (data, variables) => {
      if (process.env.NODE_ENV === 'development') {
        console.info('[cars:mutation] Vehículo actualizado exitosamente', { id: variables.id })
      }
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] })
      
      // ✅ TRACKEAR ID PARA REVALIDACIÓN MANUAL
      if (variables.id) {
        addDirtyVehicleId(variables.id)
        if (process.env.NODE_ENV === 'development') {
          console.debug('[cars:mutation] ID trackeado para revalidación:', variables.id)
        }
      }
    },
    onError: (error) => {
      const msg = handleMutationError(error, 'actualizar')
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[cars:mutation] onError update: ${msg}`)
      }
    }
  })
  
  // ✅ MUTATION: Eliminar vehículo
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = getAuthToken()
      if (!token) {
        throw new Error('❌ No se encontró token de autorización')
      }
      const response = await vehiclesAdminService.deleteVehicle(id)
      return response.data
    },
    onSuccess: (data, id) => {
      if (process.env.NODE_ENV === 'development') {
        console.info('[cars:mutation] Vehículo eliminado exitosamente', { id })
      }
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.removeQueries({ queryKey: ['vehicle', id] })
      
      // ✅ TRACKEAR ID PARA REVALIDACIÓN MANUAL (también para eliminar, necesita limpiar cache)
      if (id) {
        addDirtyVehicleId(id)
        if (process.env.NODE_ENV === 'development') {
          console.debug('[cars:mutation] ID trackeado para revalidación (eliminado):', id)
        }
      }
    },
    onError: (error) => {
      const msg = handleMutationError(error, 'eliminar')
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[cars:mutation] onError delete: ${msg}`)
      }
    }
  })
  
  return {
    createMutation,
    updateMutation,
    deleteMutation
  }
}

