/**
 * dirtyVehicleIds.js - Helper para manejar IDs de vehículos modificados
 * 
 * Persiste en localStorage los IDs de vehículos que fueron creados/editados/eliminados
 * para revalidación manual posterior.
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

const STORAGE_KEY = 'dirtyVehicleIds'

/**
 * Obtener IDs sucios desde localStorage
 * @returns {string[]} Array de IDs
 */
export const getDirtyVehicleIds = () => {
  try {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[dirtyVehicleIds] Error al leer localStorage:', error)
    }
    return []
  }
}

/**
 * Agregar un ID a la lista de sucios (con deduplicación)
 * @param {string} id - ID del vehículo
 */
export const addDirtyVehicleId = (id) => {
  try {
    if (typeof window === 'undefined' || !id) return
    
    const current = getDirtyVehicleIds()
    const idStr = String(id)
    
    // Deduplicar
    if (!current.includes(idStr)) {
      const updated = [...current, idStr]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('[dirtyVehicleIds] ID agregado:', idStr, 'Total:', updated.length)
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[dirtyVehicleIds] Error al agregar ID:', error)
    }
  }
}

/**
 * Remover un ID de la lista de sucios
 * @param {string} id - ID del vehículo
 */
export const removeDirtyVehicleId = (id) => {
  try {
    if (typeof window === 'undefined' || !id) return
    
    const current = getDirtyVehicleIds()
    const idStr = String(id)
    const updated = current.filter(existingId => existingId !== idStr)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[dirtyVehicleIds] ID removido:', idStr, 'Restantes:', updated.length)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[dirtyVehicleIds] Error al remover ID:', error)
    }
  }
}

/**
 * Limpiar todos los IDs sucios
 */
export const clearDirtyVehicleIds = () => {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
    
    if (process.env.NODE_ENV === 'development') {
      console.debug('[dirtyVehicleIds] Lista limpiada')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[dirtyVehicleIds] Error al limpiar:', error)
    }
  }
}

