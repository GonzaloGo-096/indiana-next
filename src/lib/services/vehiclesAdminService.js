/**
 * vehiclesAdminService.js - Servicio exclusivo para operaciones de Admin (Dashboard)
 * - Usa authAxiosInstance para todas las operaciones
 * - Endpoints de creación/actualización/eliminación
 * 
 * @author Indiana Usados
 * @version 1.1.0 - Usa API Route de Next.js para optimización de imágenes
 */

import { authAxiosInstance } from '@/lib/api/axiosInstance'
import { AUTH_CONFIG } from '@/config/auth'

const vehiclesAdminService = {
  /**
   * Crear un nuevo vehículo
   * @param {FormData} formData - Datos del vehículo con imágenes
   * @returns {Promise<Object>} Respuesta del backend
   */
  async createVehicle(formData) {
    // ✅ Usar API Route de Next.js que optimiza imágenes antes de enviar al backend
    // La API Route está en el mismo dominio, así que usamos fetch con URL relativa
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
      : null
    
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Usar URL relativa para la API Route de Next.js
    const response = await fetch('/api/photos/create', {
      method: 'POST',
      headers: headers,
      body: formData,
      // No setear Content-Type - fetch lo hace automáticamente para FormData
    })
    
    if (!response.ok) {
      // ✅ Manejar errores correctamente (el backend puede devolver "true" como string)
      let errorData
      try {
        const text = await response.text()
        // Intentar parsear como JSON
        try {
          errorData = JSON.parse(text)
        } catch {
          // Si no es JSON, usar el texto como mensaje
          errorData = { message: text || `HTTP ${response.status}`, error: text || 'Error desconocido' }
        }
      } catch (parseError) {
        errorData = { 
          error: 'Error desconocido',
          message: `HTTP ${response.status}` 
        }
      }
      
      // Si errorData es un booleano o primitivo, convertirlo a objeto
      if (typeof errorData !== 'object' || errorData === null) {
        errorData = { 
          message: String(errorData) || `HTTP ${response.status}`,
          error: String(errorData) || 'Error desconocido'
        }
      }
      
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
    }
    
    // ✅ Parsear respuesta exitosa
    const responseText = await response.text()
    try {
      return JSON.parse(responseText)
    } catch {
      // Si no es JSON, retornar el texto
      return responseText
    }
  },

  /**
   * Actualizar un vehículo existente
   * @param {string} id - ID del vehículo
   * @param {FormData} formData - Datos actualizados del vehículo
   * @returns {Promise<Object>} Respuesta del backend
   */
  async updateVehicle(id, formData) {
    // ✅ Validar que el ID esté presente
    if (!id) {
      throw new Error('ID de vehículo requerido para actualizar')
    }
    
    // ✅ Usar API Route de Next.js que optimiza imágenes antes de enviar al backend
    // La API Route está en el mismo dominio, así que usamos fetch con URL relativa
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
      : null
    
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Usar URL relativa para la API Route de Next.js
    const apiUrl = `/api/photos/update/${id}`
    if (process.env.NODE_ENV === 'development') {
      console.debug('[admin:vehicles] updateVehicle', { id, apiUrl })
    }
    
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: headers,
      body: formData,
      // No setear Content-Type - fetch lo hace automáticamente para FormData
    })
    
    if (!response.ok) {
      // ✅ Manejar errores correctamente (el backend puede devolver "true" como string)
      let errorData
      try {
        const text = await response.text()
        // Intentar parsear como JSON
        try {
          errorData = JSON.parse(text)
        } catch {
          // Si no es JSON, usar el texto como mensaje
          errorData = { message: text || `HTTP ${response.status}`, error: text || 'Error desconocido' }
        }
      } catch (parseError) {
        errorData = { 
          error: 'Error desconocido',
          message: `HTTP ${response.status}` 
        }
      }
      
      // Si errorData es un booleano o primitivo, convertirlo a objeto
      if (typeof errorData !== 'object' || errorData === null) {
        errorData = { 
          message: String(errorData) || `HTTP ${response.status}`,
          error: String(errorData) || 'Error desconocido'
        }
      }
      
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
    }
    
    // ✅ Parsear respuesta exitosa
    const responseText = await response.text()
    try {
      return JSON.parse(responseText)
    } catch {
      // Si no es JSON, retornar el texto
      return responseText
    }
  },

  /**
   * Eliminar un vehículo
   * @param {string} id - ID del vehículo
   * @returns {Promise<Object>} Respuesta del backend
   */
  async deleteVehicle(id) {
    const response = await authAxiosInstance.delete(`/photos/deletephoto/${id}`)
    return response.data
  }
}

export default vehiclesAdminService



