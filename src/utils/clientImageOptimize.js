/**
 * Optimización de imágenes en el cliente (admin) antes de armar FormData.
 * Alineado con el máximo ancho usado en la API Route (Sharp ~1200px).
 */

import imageCompression from 'browser-image-compression'
import { FORM_RULES } from '@/constants/forms'

/**
 * @param {File} file
 * @returns {Promise<File>} Archivo WebP optimizado (mismo uso que el original en FormData)
 */
export async function clientImageOptimize(file) {
  if (!file || typeof file !== 'object') {
    throw new Error('Archivo inválido')
  }

  const options = {
    maxWidthOrHeight: FORM_RULES.CLIENT_OPTIMIZE_MAX_EDGE,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: FORM_RULES.CLIENT_OPTIMIZE_WEBP_QUALITY,
  }

  const compressed = await imageCompression(file, options)
  const baseName = String(file.name || 'image').replace(/\.[^/.]+$/, '')
  const outName = `${baseName}.webp`

  if (compressed instanceof File) {
    return compressed
  }

  return new File([compressed], outName, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
