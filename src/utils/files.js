/**
 * Utilidades para validación de archivos
 * 
 * @author Indiana Usados
 * @version 1.0.0
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

export const filterValidFiles = (files, { maxBytes, acceptWebpOnly = true } = {}) => {
  const arr = Array.from(files || [])
  return arr.filter((f) => {
    if (acceptWebpOnly && !isValidWebp(f)) return false
    if (maxBytes && !isUnderMaxSize(f, maxBytes)) return false
    return true
  })
}


