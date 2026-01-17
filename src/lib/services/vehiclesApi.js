/**
 * vehiclesApi.js - Servicio de vehículos para Client Components
 * 
 * Usa axios para Client Components (necesario para interceptors de auth)
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

import axiosInstance from '@/lib/api/axiosInstance'
import { buildSearchParams } from '@/utils/filters'

const vehiclesService = {
  /**
   * Obtener lista de vehículos con filtros y paginación
   */
  async getVehicles({ filters = {}, limit = 8, cursor = 1, signal }) {
    // ✅ Construir parámetros usando la misma función que en producción
    const urlParams = buildSearchParams(filters)
    
    // ✅ CRÍTICO: El backend espera 'cursor', no 'page'
    urlParams.set('limit', String(limit))
    urlParams.set('cursor', String(cursor))
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[vehiclesApi] Fetching vehicles:', {
        limit,
        cursor,
        filters,
        url: `/photos/getallphotos?${urlParams.toString()}`
      })
    }

    const response = await axiosInstance.get(`/photos/getallphotos?${urlParams.toString()}`, {
      signal
    })

    return response.data
  },

  /**
   * Obtener un vehículo por ID
   */
  async getVehicleById(id) {
    const response = await axiosInstance.get(`/photos/getonephoto/${id}`)
    return response.data
  }
}

export default vehiclesService
export { vehiclesService }
