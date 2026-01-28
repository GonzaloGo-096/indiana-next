/**
 * normalizeForForm.js - Normaliza detalle de vehículo a initialData del CarFormRHF
 * 
 * @author Indiana Usados
 * @version 3.0.0 - Next.js compatible (simplificado)
 */

import { extractVehicleImageUrls, extractAllImageUrls } from '@/utils/imageExtractors'

/**
 * Extrae el objeto detalle desde posibles envoltorios de respuesta
 */
export const unwrapDetail = (detail) => {
  if (!detail) return null
  // data puede ser objeto o array
  if (detail.data) {
    if (Array.isArray(detail.data)) return detail.data[0] || null
    if (typeof detail.data === 'object') return detail.data
  }
  // getOnePhoto puede ser objeto o array
  if (detail.getOnePhoto) {
    if (Array.isArray(detail.getOnePhoto)) return detail.getOnePhoto[0] || null
    if (typeof detail.getOnePhoto === 'object') return detail.getOnePhoto
  }
  // photo puede ser objeto o array
  if (detail.photo) {
    if (Array.isArray(detail.photo)) return detail.photo[0] || null
    if (typeof detail.photo === 'object') return detail.photo
  }
  // vehiculo puede ser objeto o array
  if (detail.vehiculo) {
    if (Array.isArray(detail.vehiculo)) return detail.vehiculo[0] || null
    if (typeof detail.vehiculo === 'object') return detail.vehiculo
  }
  return detail
}

/**
 * Normaliza cilindrada para el formulario
 */
const normalizeCilindrada = (value) => {
  if (!value) return ''
  if (typeof value === 'number') return value.toString()
  const str = String(value).trim()
  return str.replace(/[^\d.]/g, '') // Solo números y punto decimal
}

/**
 * Mapea el detalle a initialData que espera CarFormRHF
 */
export const normalizeDetailToFormInitialData = (rawDetail) => {
  const d = unwrapDetail(rawDetail) || {}

  // Extraer imágenes
  const { principal, hover } = extractVehicleImageUrls(d)
  const allImages = extractAllImageUrls(d, { includeExtras: true })

  // Convertir a formato de formulario (urls object)
  const urls = {}
  if (principal) urls.fotoPrincipal = principal
  if (hover) urls.fotoHover = hover
  allImages.forEach((url, index) => {
    if (url && url !== principal && url !== hover) {
      urls[`fotoExtra${index + 1}`] = url
    }
  })

  return {
    _id: d._id || d.id || '',
    marca: d.marca || d.brand || '',
    modelo: d.modelo || d.model || '',
    version: d.version || '',
    precio: d.precio ?? d.price ?? '',
    caja: d.caja || '',
    segmento: d.segmento || d.categoria || d.categoriaVehiculo || '',
    cilindrada: normalizeCilindrada(d.cilindrada),
    color: d.color || '',
    anio: d.anio ?? d.año ?? d.year ?? '',
    combustible: d.combustible || d.fuel || '',
    transmision: d.transmision || d.transmission || '',
    kilometraje: d.kilometraje ?? d.kms ?? d.kilometers ?? '',
    traccion: d.traccion || '',
    tapizado: d.tapizado || '',
    categoriaVehiculo: d.categoriaVehiculo || d.segmento || '',
    frenos: d.frenos || '',
    turbo: d.turbo || '',
    llantas: d.llantas || '',
    HP: d.HP ?? d.hp ?? '',
    detalle: d.detalle || d.description || '',
    urls
  }
}

export default normalizeDetailToFormInitialData



