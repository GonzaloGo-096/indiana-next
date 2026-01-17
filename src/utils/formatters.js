/**
 * formatters.js - Funciones de formateo de datos
 * 
 * Funciones básicas para formatear precios, kilómetros, años, etc.
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

/**
 * Formatear precio en formato de moneda
 * @param {number|string} price - Precio a formatear
 * @returns {string} - Precio formateado
 */
export const formatPrice = (price) => {
  if (!price || price === 0) return "Consultar";

  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "Consultar";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
};

/**
 * Formatear kilómetros
 * @param {number|string} kilometers - Kilómetros a formatear
 * @returns {string} - Kilómetros formateados
 */
export const formatKilometraje = (kilometers) => {
  if (!kilometers || kilometers === 0) return "0";

  const numKm =
    typeof kilometers === "string" ? parseFloat(kilometers) : kilometers;
  if (isNaN(numKm)) return "0";

  return new Intl.NumberFormat("es-AR").format(numKm);
};

/**
 * Formatear año
 * @param {number|string} year - Año a formatear
 * @returns {string} - Año formateado
 */
export const formatYear = (year) => {
  if (!year) return "-";

  const numYear = typeof year === "string" ? parseInt(year, 10) : year;
  if (isNaN(numYear)) return "-";

  return numYear.toString();
};

/**
 * Formatear tipo de caja
 * @param {string} caja - Tipo de caja
 * @returns {string} - Caja formateada
 */
export const formatCaja = (caja) => {
  if (!caja) return "-";

  const cajaLower = caja.toLowerCase();

  if (cajaLower.includes("manual")) return "Manual";
  if (cajaLower.includes("automatic")) return "Automática";
  if (cajaLower.includes("cvt")) return "CVT";

  return caja.charAt(0).toUpperCase() + caja.slice(1).toLowerCase();
};

/**
 * Formatear marca y modelo
 * @param {string} marca - Marca del vehículo
 * @param {string} modelo - Modelo del vehículo
 * @returns {string} - Marca y modelo formateados
 */
export const formatBrandModel = (marca, modelo) => {
  const marcaFormatted = marca
    ? marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase()
    : "";
  const modeloFormatted = modelo
    ? modelo.charAt(0).toUpperCase() + modelo.slice(1).toLowerCase()
    : "";

  if (marcaFormatted && modeloFormatted) {
    return `${marcaFormatted} ${modeloFormatted}`;
  }

  return marcaFormatted || modeloFormatted || "-";
};

/**
 * Formatear valor genérico (mostrar "-" si está vacío)
 * @param {*} value - Valor a formatear
 * @returns {string} - Valor formateado o "-"
 */
export const formatValue = (value) => {
  if (!value || value === "" || value === "null" || value === "undefined") {
    return "-";
  }
  return value;
};

/**
 * Normaliza cilindrada a formato X.X
 * Maneja números, strings, valores legacy desde backend
 * 
 * @param {number|string} value - Valor de cilindrada
 * @returns {string} - Valor normalizado en formato X.X o string vacío
 * 
 * @example
 * normalizeCilindrada(2)       // "2.0"
 * normalizeCilindrada("2")     // "2.0"
 * normalizeCilindrada(2.5)     // "2.5"
 * normalizeCilindrada("2.5")   // "2.5"
 * normalizeCilindrada(2.099)   // "2.1"
 * normalizeCilindrada("")      // ""
 * normalizeCilindrada(null)    // ""
 */
export const normalizeCilindrada = (value) => {
  // Valores nulos o vacíos
  if (!value && value !== 0) return "";

  // Parsear como número
  const num = parseFloat(value);

  // Si no es un número válido, retornar vacío
  if (isNaN(num)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("normalizeCilindrada: valor no numérico:", value);
    }
    return "";
  }

  // Formatear a 1 decimal (2 → "2.0", 2.5 → "2.5")
  return num.toFixed(1);
};

/**
 * Formatea cilindrada para visualización con sufijo "L"
 * 
 * @param {string|number} value - Valor de cilindrada
 * @returns {string} - Valor formateado con unidad
 * 
 * @example
 * formatCilindradaDisplay("2.0") // "2.0 L"
 * formatCilindradaDisplay(2.5)   // "2.5 L"
 * formatCilindradaDisplay("")    // ""
 */
export const formatCilindradaDisplay = (value) => {
  if (!value) return "";
  const normalized = normalizeCilindrada(value);
  return normalized ? `${normalized} L` : "";
};

/**
 * Formatea HP para visualización con sufijo "HP"
 * 
 * @param {string|number} value - Valor de HP
 * @returns {string} - Valor formateado con unidad
 * 
 * @example
 * formatHPDisplay("150") // "150 HP"
 * formatHPDisplay(200)   // "200 HP"
 * formatHPDisplay("")    // ""
 */
export const formatHPDisplay = (value) => {
  if (!value) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return `${num} HP`;
};

