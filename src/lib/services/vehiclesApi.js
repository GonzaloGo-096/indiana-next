/**
 * vehiclesApi.js - Servicio de vehículos para Client Components
 * 
 * Usa axios para Client Components (necesario para interceptors de auth)
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

import axiosInstance from '@/lib/http/client'
import { buildSearchParams } from '@/utils/filters'

const vehiclesService = {
  /**
   * Obtener lista de vehículos con filtros y paginación
   *
   * @param {Object} params
   * @param {Object} [params.filters={}] - Filtros del frontend
   * @param {number} [params.limit=8] - Tamaño de página
   * @param {number} [params.cursor=1] - Cursor de paginación
   * @param {AbortSignal} [params.signal] - Para cancelar la request
   * @param {boolean} [params.mergeDefaults=false] - Si true, rellena rangos faltantes (precio/km) con FILTER_DEFAULTS antes de enviarlos al backend. **Por defecto false**: no se aplican filtros invisibles, el cliente ve todo el inventario salvo lo que filtre explícitamente. Sólo activar si se quiere acotar el listado a un rango "comercial" sin que el usuario lo pida.
   */
  async getVehicles({ filters = {}, limit = 8, cursor = 1, signal, mergeDefaults = false }) {
    // ✅ Construir parámetros usando la misma función que en producción
    // Los rangos que están en su posición inicial NO se mandan.
    //
    // Antes iba `includeDefaultRanges: true`, que los mandaba siempre. El
    // formulario guarda los tres rangos aunque el visitante no los toque,
    // así que al filtrar por año también viajaba "precio desde 5.000.000":
    // un filtro que nadie pidió. Y como ese mínimo no coincide con el
    // inventario real, borraba autos válidos y podía dejar la lista vacía.
    //
    // "Rango completo" y "sin filtrar" son lo mismo, así que omitirlo no
    // cambia el resultado: solo deja de esconder autos.
    const urlParams = buildSearchParams(filters, {
      mergeDefaults,
    })
    
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
    const cleanId =
      id != null && id !== undefined
        ? `${id}`.trim().split(/\s+/)[0] || `${id}`.trim()
        : "";
    const response = await axiosInstance.get(`/photos/getonephoto/${cleanId}`);
    return response.data;
  }
}

export default vehiclesService
export { vehiclesService }
