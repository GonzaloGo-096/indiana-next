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

  // Oferta: boolean (backend puede enviar true/false)
  const oferta = v.oferta === true || v.oferta === 'true'
  const rawDescuento = v.descuento ?? 0
  const descuento = Math.min(100, Math.max(0, Number(rawDescuento) || 0))
  const precioOferta = oferta && descuento > 0
    ? (v.precioOferta != null && !isNaN(Number(v.precioOferta))
        ? Number(v.precioOferta)
        : Math.round(precio * (1 - descuento / 100)))
    : null

  return {
    id,
    marca: String(v.marca || '').trim(),
    modelo: String(v.modelo || '').trim(),
    version: String(v.version || '').trim(),
    anio,
    kilometraje,
    precio,
    precioOferta,
    firstImageUrl,
    oferta,
    descuento: oferta ? descuento : 0,
    // Preservar original para operaciones que requieren datos completos
    _original: v
  }
}



