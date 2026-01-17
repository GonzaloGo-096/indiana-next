/**
 * filters.js - Utilidades para manejo de filtros de vehículos
 * 
 * ✅ ÚNICA FUENTE DE VERDAD para filtros
 * - Convierte filtros entre formato frontend (objetos) y URL (searchParams)
 * - NO duplicar lógica: una sola función buildSearchParams()
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

/**
 * Valores por defecto de filtros
 * Usados para optimizar query params (no incluir si son valores por defecto)
 * 
 * ✅ IMPORTAR desde constants para mantener consistencia
 */
import { FILTER_DEFAULTS } from "../constants/filterOptions";

/**
 * Construye URLSearchParams desde objeto de filtros
 * 
 * ✅ ÚNICA FUNCIÓN para construir searchParams desde filtros
 * Usada tanto en Server Components como Client Components
 * 
 * @param {Object} filters - Objeto de filtros del frontend
 * @param {Array} filters.marca - Array de marcas seleccionadas
 * @param {Array} filters.caja - Array de tipos de caja
 * @param {Array} filters.combustible - Array de tipos de combustible
 * @param {Array} filters.año - [min, max] rango de años
 * @param {Array} filters.precio - [min, max] rango de precios
 * @param {Array} filters.kilometraje - [min, max] rango de kilómetros
 * @param {number} filters.page - Página actual (opcional, para paginación)
 * @returns {URLSearchParams} Parámetros listos para URL o backend
 */
export const buildSearchParams = (filters = {}) => {
  const params = new URLSearchParams();

  // Logging solo en desarrollo
  if (process.env.NODE_ENV === "development") {
    console.debug("[Filters] Construyendo searchParams:", filters);
  }

  // ===== FILTROS SIMPLES (arrays → strings con comas) =====

  if (filters.marca && Array.isArray(filters.marca) && filters.marca.length > 0) {
    params.set("marca", filters.marca.join(","));
  }

  if (filters.caja && Array.isArray(filters.caja) && filters.caja.length > 0) {
    params.set("caja", filters.caja.join(","));
  }

  if (
    filters.combustible &&
    Array.isArray(filters.combustible) &&
    filters.combustible.length > 0
  ) {
    params.set("combustible", filters.combustible.join(","));
  }

  // ===== RANGOS (arrays → "min,max") =====
  // Solo incluir si NO son valores por defecto (optimización de query params)

  if (filters.año && Array.isArray(filters.año) && filters.año.length === 2) {
    const [min, max] = filters.año;
    const isDefault =
      min === FILTER_DEFAULTS.AÑO.min && max === FILTER_DEFAULTS.AÑO.max;
    if (!isDefault) {
      params.set("anio", `${min},${max}`);
    }
  }

  if (
    filters.precio &&
    Array.isArray(filters.precio) &&
    filters.precio.length === 2
  ) {
    const [min, max] = filters.precio;
    const isDefault =
      min === FILTER_DEFAULTS.PRECIO.min && max === FILTER_DEFAULTS.PRECIO.max;
    if (!isDefault) {
      params.set("precio", `${min},${max}`);
    }
  }

  if (
    filters.kilometraje &&
    Array.isArray(filters.kilometraje) &&
    filters.kilometraje.length === 2
  ) {
    const [min, max] = filters.kilometraje;
    const isDefault =
      min === FILTER_DEFAULTS.KILOMETRAJE.min &&
      max === FILTER_DEFAULTS.KILOMETRAJE.max;
    if (!isDefault) {
      params.set("km", `${min},${max}`);
    }
  }

  // ===== PAGINACIÓN =====
  if (filters.page && Number.isFinite(Number(filters.page)) && Number(filters.page) > 0) {
    params.set("page", String(filters.page));
  }

  // Logging solo en desarrollo
  if (process.env.NODE_ENV === "development") {
    console.debug("[Filters] SearchParams generados:", params.toString());
  }

  return params;
};

/**
 * Alias para compatibilidad con código existente
 * @deprecated Usar buildSearchParams() en su lugar
 */
export const buildFiltersForBackend = buildSearchParams;

/**
 * Parsea URLSearchParams a objeto de filtros del frontend
 * 
 * ✅ ÚNICA FUNCIÓN para parsear searchParams a filtros
 * Usada tanto en Server Components como Client Components
 * 
 * @param {URLSearchParams|Object} searchParams - Parámetros de URL (Next.js searchParams o URLSearchParams)
 * @returns {Object} Objeto de filtros para el frontend
 */
export const parseFilters = (searchParams) => {
  const filters = {};

  // Manejar diferentes tipos de searchParams
  let params;
  
  if (searchParams instanceof URLSearchParams) {
    // Ya es URLSearchParams
    params = searchParams;
  } else if (searchParams && typeof searchParams === "object") {
    // Es un objeto plano de Next.js (searchParams ya resuelto con await)
    // Convertir a URLSearchParams de forma segura
    try {
      // Crear URLSearchParams desde las entradas del objeto
      params = new URLSearchParams();
      // Usar Object.keys en lugar de for...in para evitar Symbols
      const keys = Object.keys(searchParams);
      for (const key of keys) {
        if (typeof key === "string") {
          const value = searchParams[key];
          // Solo agregar si el valor es string o number
          if (typeof value === "string" || typeof value === "number") {
            params.set(key, String(value));
          }
        }
      }
    } catch (error) {
      // Si falla, crear URLSearchParams vacío
      console.warn("[parseFilters] Error parsing searchParams:", error);
      params = new URLSearchParams();
    }
  } else {
    // Fallback: URLSearchParams vacío
    params = new URLSearchParams();
  }

  // Leer filtros simples (strings → arrays)
  const marca = params.get("marca");
  if (marca && typeof marca === "string") {
    filters.marca = marca.split(",");
  }

  const caja = params.get("caja");
  if (caja && typeof caja === "string") {
    filters.caja = caja.split(",");
  }

  const combustible = params.get("combustible");
  if (combustible && typeof combustible === "string") {
    filters.combustible = combustible.split(",");
  }

  // Leer rangos (strings → arrays de números)
  const anio = params.get("anio");
  if (anio && typeof anio === "string") {
    const [min, max] = anio.split(",").map(Number);
    if (!isNaN(min) && !isNaN(max)) filters.año = [min, max];
  }

  const precio = params.get("precio");
  if (precio && typeof precio === "string") {
    const [min, max] = precio.split(",").map(Number);
    if (!isNaN(min) && !isNaN(max)) filters.precio = [min, max];
  }

  const km = params.get("km");
  if (km && typeof km === "string") {
    const [min, max] = km.split(",").map(Number);
    if (!isNaN(min) && !isNaN(max)) filters.kilometraje = [min, max];
  }

  // Leer paginación
  const page = params.get("page");
  if (page && typeof page === "string") {
    const pageNum = Number(page);
    if (!isNaN(pageNum) && pageNum > 0) filters.page = pageNum;
  }

  return filters;
};

/**
 * Detecta si hay algún filtro activo
 * @param {Object} filters - Objeto de filtros
 * @returns {boolean} True si hay al menos un filtro activo
 */
export const hasAnyFilter = (filters = {}) => {
  return Object.values(filters).some((value) =>
    value && (Array.isArray(value) ? value.length > 0 : true)
  );
};

/**
 * Ordena vehículos según criterio de ordenamiento
 * @param {Array} vehicles - Array de vehículos
 * @param {string} sortOption - Opción de ordenamiento
 * @returns {Array} Array ordenado (nueva copia, no muta original)
 */
export const sortVehicles = (vehicles = [], sortOption) => {
  if (!sortOption || !Array.isArray(vehicles) || vehicles.length === 0) {
    return vehicles;
  }

  return [...vehicles].sort((a, b) => {
    switch (sortOption) {
      case "precio_desc":
        return (b.precio || 0) - (a.precio || 0);
      case "precio_asc":
        return (a.precio || 0) - (b.precio || 0);
      case "km_desc":
        return (b.kilometraje || 0) - (a.kilometraje || 0);
      case "km_asc":
        return (a.kilometraje || 0) - (b.kilometraje || 0);
      default:
        return 0;
    }
  });
};

/**
 * Valida si una opción de sorting es válida
 * @param {string} sortOption - Opción a validar
 * @returns {boolean} True si es válida
 */
export const isValidSortOption = (sortOption) => {
  const validOptions = ["precio_desc", "precio_asc", "km_desc", "km_asc"];
  return validOptions.includes(sortOption);
};

