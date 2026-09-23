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
  /**
   * Cuántos pedir para los carruseles de la ficha. Es el doble de lo que se
   * muestra porque después se excluyen el auto actual y los vendidos (que no
   * van en carruseles), y el carrusel no debe achicarse por eso.
   */
  SIMILAR_FETCH_LIMIT: 10,
  
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

/**
 * Lo único que ve el visitante cuando el listado no se pudo cargar, sea cual
 * sea la falla (backend, red, timeout, respuesta inválida). El detalle técnico
 * va al log, nunca a la pantalla.
 */
export const LIST_ERROR_MESSAGE =
  "No pudimos cargar los vehículos. Probá de nuevo en unos minutos.";

