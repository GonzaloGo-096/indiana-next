/**
 * Storage Keys - Constantes centralizadas para SessionStorage/LocalStorage
 * 
 * ✅ PROPÓSITO: Evitar typos y mantener consistencia en keys de storage
 * ✅ USO: Importar y usar en lugar de strings hardcodeados
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

/**
 * Keys para SessionStorage
 */
export const STORAGE_KEYS = {
  /** Posición de scroll de la lista de vehículos */
  VEHICLES_LIST_SCROLL: 'vehicles_list_scroll',
  
  /** Posición de scroll de vehículos (legacy, mantener por compatibilidad) */
  VEHICLES_SCROLL_POSITION: 'vehiculos_scroll_position',
};

/**
 * Helper para obtener una key de storage
 * @param {keyof typeof STORAGE_KEYS} key - Nombre de la key
 * @returns {string} Key de storage
 */
export const getStorageKey = (key) => STORAGE_KEYS[key];

