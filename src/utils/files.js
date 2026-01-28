/**
 * Utilidades para validación de archivos
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Soporta JPG, PNG y WEBP
 */

// ✅ Tipos MIME y extensiones soportadas
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Validar si un archivo es una imagen soportada (JPG, PNG, WEBP)
 * @param {File} file - Archivo a validar
 * @returns {boolean}
 */
export const isValidImage = (file) => {
  if (!file) return false
  
  // Validar por tipo MIME
  const typeOk = SUPPORTED_IMAGE_TYPES.includes(String(file.type || ''))
  
  // Validar por extensión (fallback)
  const name = String(file.name || '').toLowerCase()
  const extensionOk = SUPPORTED_EXTENSIONS.some(ext => name.endsWith(ext))
  
  return typeOk || extensionOk
}

/**
 * Validar si un archivo es WebP (mantenido para compatibilidad)
 * @param {File} file - Archivo a validar
 * @returns {boolean}
 */
export const isValidWebp = (file) => {
  if (!file) return false
  const nameOk = String(file.name || '').toLowerCase().endsWith('.webp')
  const typeOk = String(file.type || '') === 'image/webp'
  return nameOk || typeOk
}

export const isUnderMaxSize = (file, maxBytes) => {
  if (!file) return false
  return Number(file.size || 0) <= Number(maxBytes)
}

/**
 * Filtrar archivos válidos
 * @param {FileList|File[]} files - Archivos a filtrar
 * @param {Object} options - Opciones de filtrado
 * @param {number|null} options.maxBytes - Tamaño máximo en bytes (null = sin límite)
 * @param {boolean} options.acceptWebpOnly - Si solo acepta WebP (legacy, usar false para aceptar JPG/PNG/WEBP)
 * @returns {File[]} Archivos válidos
 */
export const filterValidFiles = (files, { maxBytes, acceptWebpOnly = false } = {}) => {
  const arr = Array.from(files || [])
  return arr.filter((f) => {
    // Si acceptWebpOnly es true, usar validación legacy (solo WebP)
    if (acceptWebpOnly && !isValidWebp(f)) return false
    // Si acceptWebpOnly es false, usar validación nueva (JPG/PNG/WEBP)
    if (!acceptWebpOnly && !isValidImage(f)) return false
    // Validar tamaño solo si maxBytes está definido y no es null
    if (maxBytes != null && !isUnderMaxSize(f, maxBytes)) return false
    return true
  })
}



