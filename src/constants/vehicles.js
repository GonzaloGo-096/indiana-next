/**
 * Vehicle Constants - Constantes para vehículos
 * 
 * ✅ PROPÓSITO: Centralizar valores mágicos y configuraciones
 * ✅ USO: Importar y usar en lugar de números/strings hardcodeados
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

/**
 * Configuración de paginación y límites
 */
export const VEHICLE_CONSTANTS = {
  /** Límite de vehículos similares a pedir (para asegurar 5 después de excluir actual) */
  SIMILAR_FETCH_LIMIT: 6,
  
  /** Máximo de vehículos similares a mostrar */
  SIMILAR_MAX_RESULTS: 5,
  
  /** Tamaño de página para listado principal */
  LIST_PAGE_SIZE: 8,
  
  /** Rango de precio para vehículos similares (±1 millón) */
  PRICE_RANGE: 1000000,
  
  /** Delay para restaurar scroll (ms) */
  SCROLL_RESTORE_DELAY: 100,
  
  /** Timeout para restaurar scroll después de carga (ms) */
  SCROLL_RESTORE_TIMEOUT: 300,
  
  /** Tiempo máximo de validez de datos de scroll (5 minutos en ms) */
  SCROLL_DATA_MAX_AGE: 5 * 60 * 1000,
};

/**
 * Helper para obtener una constante
 * @param {keyof typeof VEHICLE_CONSTANTS} key - Nombre de la constante
 * @returns {number} Valor de la constante
 */
export const getVehicleConstant = (key) => VEHICLE_CONSTANTS[key];

