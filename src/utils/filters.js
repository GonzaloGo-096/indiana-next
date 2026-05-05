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

/** Completa año / precio / km cuando faltan en la URL (valores = FILTER_DEFAULTS). */
export function mergeDefaultRanges(filters = {}) {
  const f = { ...filters };
  if (!Array.isArray(f.año) || f.año.length !== 2) {
    f.año = [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max];
  }
  if (!Array.isArray(f.precio) || f.precio.length !== 2) {
    f.precio = [FILTER_DEFAULTS.PRECIO.min, FILTER_DEFAULTS.PRECIO.max];
  }
  if (!Array.isArray(f.kilometraje) || f.kilometraje.length !== 2) {
    f.kilometraje = [
      FILTER_DEFAULTS.KILOMETRAJE.min,
      FILTER_DEFAULTS.KILOMETRAJE.max,
    ];
  }
  return f;
}

/**
 * Valores de caja que el backend puede tener como "Automático" u otras variantes;
 * el filtro muestra "Automática" y aquí se envían ambos al query.
 */
function expandCajaValuesForApi(cajaArray) {
  if (!Array.isArray(cajaArray) || cajaArray.length === 0) return [];
  const out = [];
  for (const raw of cajaArray) {
    const v = typeof raw === "string" ? raw.trim() : raw;
    if (!v) continue;
    if (v === "Automática") {
      out.push("Automática", "Automático");
    } else {
      out.push(v);
    }
  }
  return [...new Set(out)];
}

/**
 * Normaliza tokens de URL al valor usado en el MultiSelect (Automático → Automática).
 */
function normalizeCajaTokensFromUrl(tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) return [];
  const mapped = tokens
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean)
    .map((t) => (t === "Automático" ? "Automática" : t));
  return [...new Set(mapped)];
}

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
 * @param {Object} [options]
 * @param {boolean} [options.includeDefaultRanges=false] - Si true (p. ej. llamada a la API), incluye anio/precio/km aunque coincidan con FILTER_DEFAULTS.
 * @param {boolean} [options.mergeDefaults=true] - Si false, NO rellena rangos faltantes con FILTER_DEFAULTS. Útil para el admin, que debe ver TODO el inventario sin filtros invisibles.
 * @returns {URLSearchParams} Parámetros listos para URL o backend
 */
export const buildSearchParams = (filters = {}, options = {}) => {
  const { includeDefaultRanges = false, mergeDefaults = true } = options;
  const params = new URLSearchParams();
  const f = mergeDefaults ? mergeDefaultRanges({ ...filters }) : { ...filters };

  // Logging solo en desarrollo
  if (process.env.NODE_ENV === "development") {
    console.debug("[Filters] Construyendo searchParams:", f, options);
  }

  // ===== FILTROS SIMPLES (arrays → strings con comas) =====

  if (f.marca && Array.isArray(f.marca) && f.marca.length > 0) {
    params.set("marca", f.marca.join(","));
  }

  if (f.caja && Array.isArray(f.caja) && f.caja.length > 0) {
    const forApi = expandCajaValuesForApi(f.caja);
    if (forApi.length > 0) {
      params.set("caja", forApi.join(","));
    }
  }

  if (
    f.combustible &&
    Array.isArray(f.combustible) &&
    f.combustible.length > 0
  ) {
    params.set("combustible", f.combustible.join(","));
  }

  // ===== RANGOS (arrays → "min,max") =====
  // URL: omitir si coinciden con FILTER_DEFAULTS. API: incluir siempre con includeDefaultRanges.

  if (f.año && Array.isArray(f.año) && f.año.length === 2) {
    const [min, max] = f.año;
    const isDefault =
      min === FILTER_DEFAULTS.AÑO.min && max === FILTER_DEFAULTS.AÑO.max;
    if (includeDefaultRanges || !isDefault) {
      params.set("anio", `${min},${max}`);
    }
  }

  if (f.precio && Array.isArray(f.precio) && f.precio.length === 2) {
    const [min, max] = f.precio;
    const isDefault =
      min === FILTER_DEFAULTS.PRECIO.min && max === FILTER_DEFAULTS.PRECIO.max;
    if (includeDefaultRanges || !isDefault) {
      params.set("precio", `${min},${max}`);
    }
  }

  if (f.kilometraje && Array.isArray(f.kilometraje) && f.kilometraje.length === 2) {
    const [min, max] = f.kilometraje;
    const isDefault =
      min === FILTER_DEFAULTS.KILOMETRAJE.min &&
      max === FILTER_DEFAULTS.KILOMETRAJE.max;
    if (includeDefaultRanges || !isDefault) {
      params.set("km", `${min},${max}`);
    }
  }

  // ===== PAGINACIÓN =====
  if (f.page && Number.isFinite(Number(f.page)) && Number(f.page) > 0) {
    params.set("page", String(f.page));
  }

  // Logging solo en desarrollo
  if (process.env.NODE_ENV === "development") {
    console.debug("[Filters] SearchParams generados:", params.toString());
  }

  return params;
};

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
    filters.caja = normalizeCajaTokensFromUrl(caja.split(","));
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
  const f = filters || {};
  if (f.marca?.length) return true;
  if (f.caja?.length) return true;
  if (f.combustible?.length) return true;
  if (f.page && Number(f.page) > 1) return true;
  if (f.año?.length === 2) {
    const [a, b] = f.año;
    if (a !== FILTER_DEFAULTS.AÑO.min || b !== FILTER_DEFAULTS.AÑO.max) return true;
  }
  if (f.precio?.length === 2) {
    const [a, b] = f.precio;
    if (a !== FILTER_DEFAULTS.PRECIO.min || b !== FILTER_DEFAULTS.PRECIO.max) return true;
  }
  if (f.kilometraje?.length === 2) {
    const [a, b] = f.kilometraje;
    if (
      a !== FILTER_DEFAULTS.KILOMETRAJE.min ||
      b !== FILTER_DEFAULTS.KILOMETRAJE.max
    ) {
      return true;
    }
  }
  return false;
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

/** Quita paginación del objeto (los chips / remociones no deben arrastrar `page`). */
function omitPageFromFilters(filters = {}) {
  const { page: _p, ...rest } = filters;
  return rest;
}

function formatPriceChip(min, max) {
  const fmt = (n) =>
    `$${Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

function formatKmChip(min, max) {
  const fmt = (n) =>
    `${Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 })} km`;
  return `${fmt(min)} – ${fmt(max)}`;
}

/**
 * Descriptores de filtros activos para UI (chips): cada uno trae el estado resultante al quitarlo.
 * No incluye `page` en `nextFilters`.
 *
 * @param {Object} filters - Mismo shape que `parseFilters` / estado de URL
 * @returns {Array<{ id: string, label: string, nextFilters: Object }>}
 */
export function getActiveFilterChips(filters = {}) {
  const f0 = omitPageFromFilters(filters);
  const chips = [];

  (f0.marca || []).forEach((m) => {
    const marca = (f0.marca || []).filter((x) => x !== m);
    chips.push({
      id: `marca:${m}`,
      label: m,
      nextFilters: { ...f0, marca: marca.length ? marca : undefined },
    });
  });

  (f0.caja || []).forEach((c) => {
    const caja = (f0.caja || []).filter((x) => x !== c);
    chips.push({
      id: `caja:${c}`,
      label: `Caja: ${c}`,
      nextFilters: { ...f0, caja: caja.length ? caja : undefined },
    });
  });

  (f0.combustible || []).forEach((c) => {
    const combustible = (f0.combustible || []).filter((x) => x !== c);
    chips.push({
      id: `combustible:${c}`,
      label: c,
      nextFilters: {
        ...f0,
        combustible: combustible.length ? combustible : undefined,
      },
    });
  });

  if (f0.año?.length === 2) {
    const [min, max] = f0.año;
    if (min !== FILTER_DEFAULTS.AÑO.min || max !== FILTER_DEFAULTS.AÑO.max) {
      chips.push({
        id: "año",
        label: `Año: ${min} – ${max}`,
        nextFilters: { ...f0, año: undefined },
      });
    }
  }

  if (f0.precio?.length === 2) {
    const [min, max] = f0.precio;
    if (
      min !== FILTER_DEFAULTS.PRECIO.min ||
      max !== FILTER_DEFAULTS.PRECIO.max
    ) {
      chips.push({
        id: "precio",
        label: `Precio: ${formatPriceChip(min, max)}`,
        nextFilters: { ...f0, precio: undefined },
      });
    }
  }

  if (f0.kilometraje?.length === 2) {
    const [min, max] = f0.kilometraje;
    if (
      min !== FILTER_DEFAULTS.KILOMETRAJE.min ||
      max !== FILTER_DEFAULTS.KILOMETRAJE.max
    ) {
      chips.push({
        id: "km",
        label: `Km: ${formatKmChip(min, max)}`,
        nextFilters: { ...f0, kilometraje: undefined },
      });
    }
  }

  return chips;
}

