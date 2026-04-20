/**
 * Normaliza texto para búsqueda: minúsculas y sin marcas diacríticas.
 * Ej.: "citroen" coincide con "Citroën".
 */
export function normalizeForSearch(str) {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
