/**
 * filterOptions.js - Opciones para filtros de vehículos
 * 
 * Constantes utilizadas en los filtros de búsqueda
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

/**
 * Límites del slider (rango buscable completo). No confundir con el rango inicial por defecto.
 */
export const FILTER_BOUNDS = {
  AÑO: { min: 1990, max: 2026 },
  PRECIO: { min: 5000000, max: 150000000 },
  KILOMETRAJE: { min: 0, max: 250000 },
};

/**
 * Rango por defecto: posición inicial de los sliders cuando no hay filtro en URL.
 *
 * **Convención actual**: FILTER_DEFAULTS == FILTER_BOUNDS.
 * Es decir, los sliders arrancan en los extremos (rango completo) y "no filtrar"
 * equivale a "estar en el rango completo". Cuando los valores coinciden con los
 * BOUNDS:
 *   - No se agrega el filtro a la URL (URL limpia).
 *   - No aparece chip de filtro activo.
 *   - hasAnyFilter() devuelve false.
 *   - getActiveFilterChips() no genera chip para ese rango.
 *
 * Si en el futuro se quisiera reintroducir un rango "comercial" sugerido como
 * posición inicial sin que oculte autos, conviene separar dos conceptos:
 *   - "starting position" del slider (UX)
 *   - "rango sin filtro" (no se manda al backend)
 * y trabajarlos por separado. Hoy no hace falta.
 */
export const FILTER_DEFAULTS = {
  AÑO: { ...FILTER_BOUNDS.AÑO },
  PRECIO: { ...FILTER_BOUNDS.PRECIO },
  KILOMETRAJE: { ...FILTER_BOUNDS.KILOMETRAJE },
};

// Marcas de vehículos (sin duplicados)
export const marcas = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Volkswagen",
  "Nissan",
  "Hyundai",
  "Kia",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Suzuki",
  "Daihatsu",
  "Peugeot",
  "Renault",
  "Fiat",
  "Citroën",
  "Opel",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Volvo",
  "Jaguar",
  "Land Rover",
  "Mini",
  "Smart",
  "Alfa Romeo",
  "Chery",
  "Geely",
  "BYD",
  "Tesla",
];

// Tipos de combustible (simplificados)
export const combustibles = ["Nafta", "Diesel", "Gas"];

// Tipos de caja de cambios (simplificados)
// "Automática" en UI; la API se amplía a Automático en buildSearchParams (filters.js)
export const cajas = ["Manual", "Automática", "Secuencial"];

// ✅ Opciones de ordenamiento
export const SORT_OPTIONS = [
  { value: "precio_desc", label: "Precio: Mayor a menor" },
  { value: "precio_asc", label: "Precio: Menor a mayor" },
  { value: "km_desc", label: "Kilometraje: Mayor a menor" },
  { value: "km_asc", label: "Kilometraje: Menor a mayor" },
];



