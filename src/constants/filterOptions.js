/**
 * filterOptions.js - Opciones para filtros de vehículos
 * 
 * Constantes utilizadas en los filtros de búsqueda
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

// ✅ Valores por defecto centralizados
export const FILTER_DEFAULTS = {
  AÑO: { min: 1990, max: 2024 },
  PRECIO: { min: 5000000, max: 100000000 },
  KILOMETRAJE: { min: 0, max: 200000 },
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
export const cajas = ["Manual", "Automático", "Secuencial"];

// ✅ Opciones de ordenamiento
export const SORT_OPTIONS = [
  { value: "precio_desc", label: "Precio: Mayor a menor" },
  { value: "precio_asc", label: "Precio: Menor a mayor" },
  { value: "km_desc", label: "Kilometraje: Mayor a menor" },
  { value: "km_asc", label: "Kilometraje: Menor a mayor" },
];


