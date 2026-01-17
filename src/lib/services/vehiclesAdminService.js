/**
 * vehiclesAdminService.js - Servicio exclusivo para operaciones de Admin (Dashboard)
 * - Usa authAxiosInstance para todas las operaciones
 * - Endpoints de creación/actualización/eliminación
 * 
 * @author Indiana Usados
 * @version 1.0.0 - Next.js compatible
 */

import { authAxiosInstance } from '@/lib/api/axiosInstance'

const vehiclesAdminService = {
  /**
   * Crear un nuevo vehículo
   * @param {FormData} formData - Datos del vehículo con imágenes
   * @returns {Promise<Object>} Respuesta del backend
   */
  async createVehicle(formData) {
    const response = await authAxiosInstance.post('/photos/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 2 minutos para subida de fotos
    })
    return response.data
  },

  /**
   * Actualizar un vehículo existente
   * @param {string} id - ID del vehículo
   * @param {FormData} formData - Datos actualizados del vehículo
   * @returns {Promise<Object>} Respuesta del backend
   */
  async updateVehicle(id, formData) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[admin:vehicles] updateVehicle', { id })
      }
      const response = await authAxiosInstance.put(`/photos/updatephoto/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000 // 3 minutos para actualización con fotos
      })
      return response.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[admin:vehicles] update error', { 
          status: error.response?.status, 
          message: error.message 
        })
      }
      throw error
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

