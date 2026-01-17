/**
 * toAdminListItem - Mapper de presentación para la lista del Dashboard
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

import { extractFirstImageUrl } from '@/utils/imageExtractors'

export function toAdminListItem(vehicle = {}) {
  const v = vehicle || {}
  
  // Normalizar año (variantes: anio/año/year)
  const anio = String(v.anio ?? v.año ?? v.year ?? '').trim()
  
  // Normalizar kilometraje (variantes: kilometraje/kms/kilometers)
  const rawKm = v.kilometraje ?? v.kms ?? v.kilometers ?? 0
  const kilometraje = Number(rawKm) || 0
  
  // Normalizar precio (variantes: precio/price)
  const rawPrice = v.precio ?? v.price ?? 0
  const precio = Number(rawPrice) || 0
  
  // Extraer imagen de manera segura
  const firstImageUrl = extractFirstImageUrl(v) || ''
  
  // ID seguro (prioridad: _id > id)
  const id = v._id || v.id || null

  return {
    id,
    marca: String(v.marca || '').trim(),
    modelo: String(v.modelo || '').trim(),
    version: String(v.version || '').trim(),
    anio,
    kilometraje,
    precio,
    firstImageUrl,
    // Preservar original para operaciones que requieren datos completos
    _original: v
  }
}

