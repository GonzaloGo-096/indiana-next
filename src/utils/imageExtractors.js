/**
 * imageExtractors.js - CAPA 1: Extracción simple de URLs de imágenes
 * 
 * ✅ PROPÓSITO: Extracción simple de URLs (retorna strings)
 * - Performance crítico para listados (8+ vehículos)
 * - Funciones ligeras y rápidas
 * - Sin procesamiento pesado, solo extracción directa
 * 
 * 📋 RESPONSABILIDADES:
 * - Extraer URLs de campos de imagen (objetos o strings)
 * - Extraer fotoPrincipal y fotoHover de un vehículo
 * - Extraer todas las URLs (con opción de incluir fotosExtra)
 * - Fallback a imagen por defecto cuando no hay imagen
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

/**
 * URL de imagen por defecto (placeholder)
 * TODO: Reemplazar con imagen real cuando esté disponible
 */
const DEFAULT_CAR_IMAGE = "/assets/logos/logos-indiana/desktop/logo-chico-solid.webp";

/**
 * Extrae URL de un campo de imagen (maneja objetos, strings y null)
 * 
 * @param {Object|string|null} imageField - Campo de imagen del backend
 * @returns {string|null} URL extraída o null
 * 
 * @example
 * extractImageUrl({ url: 'https://...' })      // 'https://...'
 * extractImageUrl('https://...')                // 'https://...'
 * extractImageUrl(null)                         // null
 * extractImageUrl({ other: 'data' })            // null
 */
export const extractImageUrl = (imageField) => {
  if (!imageField) return null;

  // String directo (URL como string)
  if (typeof imageField === "string") {
    const trimmed = imageField.trim();
    return trimmed === "" ? null : trimmed;
  }

  // Objeto con propiedad .url o .secure_url (Cloudinary)
  if (typeof imageField === "object") {
    // Prioridad 1: .url
    if (imageField.url && typeof imageField.url === "string") {
      const trimmed = imageField.url.trim();
      return trimmed === "" ? null : trimmed;
    }

    // Prioridad 2: .secure_url (Cloudinary)
    if (
      imageField.secure_url &&
      typeof imageField.secure_url === "string"
    ) {
      const trimmed = imageField.secure_url.trim();
      return trimmed === "" ? null : trimmed;
    }
  }

  return null;
};

/**
 * Extrae URLs principales de un vehículo (fotoPrincipal + fotoHover)
 * 
 * @param {Object} vehicle - Objeto vehículo del backend
 * @returns {Object} { principal: string|null, hover: string|null }
 * 
 * @example
 * extractVehicleImageUrls({
 *   fotoPrincipal: { url: 'https://img1.jpg' },
 *   fotoHover: 'https://img2.jpg'
 * })
 * // { principal: 'https://img1.jpg', hover: 'https://img2.jpg' }
 */
export const extractVehicleImageUrls = (vehicle) => {
  if (!vehicle || typeof vehicle !== "object") {
    return { principal: null, hover: null };
  }

  // Extraer fotoPrincipal (con fallback a imagen)
  const principal =
    extractImageUrl(vehicle.fotoPrincipal) || extractImageUrl(vehicle.imagen);

  // Extraer fotoHover
  const hover = extractImageUrl(vehicle.fotoHover);

  return { principal, hover };
};

/**
 * Extrae TODAS las URLs de imágenes de un vehículo
 * Incluye: fotoPrincipal, fotoHover, fotosExtra
 * 
 * @param {Object} vehicle - Objeto vehículo del backend
 * @param {Object} options - Opciones de extracción
 * @param {boolean} options.includeExtras - Incluir fotosExtra (default: true)
 * @param {boolean} options.filterDuplicates - Eliminar duplicados (default: true)
 * @returns {Array<string>} Array de URLs únicas
 * 
 * @example
 * extractAllImageUrls({
 *   fotoPrincipal: { url: 'img1.jpg' },
 *   fotoHover: 'img2.jpg',
 *   fotosExtra: [{ url: 'img3.jpg' }, { url: 'img4.jpg' }]
 * })
 * // ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg']
 */
export const extractAllImageUrls = (vehicle, options = {}) => {
  const { includeExtras = true, filterDuplicates = true } = options;

  if (!vehicle || typeof vehicle !== "object") return [];

  const urls = [];

  // 1. Extraer principal y hover
  const { principal, hover } = extractVehicleImageUrls(vehicle);

  if (principal) urls.push(principal);
  if (hover && hover !== principal) urls.push(hover);

  // 2. Extraer fotosExtra si está habilitado
  if (includeExtras && Array.isArray(vehicle.fotosExtra)) {
    vehicle.fotosExtra.forEach((img) => {
      const url = extractImageUrl(img);
      if (url) urls.push(url);
    });
  }

  // 3. Filtrar duplicados si está habilitado
  if (filterDuplicates) {
    return [...new Set(urls)];
  }

  return urls;
};

/**
 * Extrae primera imagen disponible de un vehículo con fallback
 * Útil para thumbnails y previews simples
 * 
 * @param {Object} vehicle - Objeto vehículo
 * @param {string} fallback - URL de fallback (default: DEFAULT_CAR_IMAGE)
 * @returns {string} URL de imagen o fallback
 * 
 * @example
 * extractFirstImageUrl({ fotoPrincipal: 'img.jpg' })
 * // 'img.jpg'
 * 
 * extractFirstImageUrl({})
 * // DEFAULT_CAR_IMAGE (imagen por defecto)
 */
export const extractFirstImageUrl = (vehicle, fallback = DEFAULT_CAR_IMAGE) => {
  const { principal } = extractVehicleImageUrls(vehicle);
  return principal || fallback;
};

