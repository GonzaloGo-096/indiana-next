/**
 * Pipeline compartido de subida de fotos.
 *
 * Antes esta lógica estaba duplicada casi literal entre
 * /api/photos/create (421 líneas) y /api/photos/update/[id] (374 líneas).
 * Cualquier arreglo había que escribirlo dos veces, y las dos copias se
 * desincronizaban en el próximo cambio.
 *
 * Además cierra el agujero que detectó la auditoría: los handlers leían el
 * FormData y corrían Sharp ANTES de mirar el header Authorization, que solo
 * se reenviaba al backend. Cualquiera sin credenciales podía hacer trabajar
 * al servidor mandando imágenes grandes o "bombas de descompresión".
 *
 * Nota sobre el alcance de la verificación: acá solo se exige que venga un
 * Bearer con forma válida. La autorización real la sigue haciendo el backend,
 * que es el dueño de la identidad. No se usa verifyAdminBearerToken a
 * propósito: hoy valida ejecutando un DELETE contra el backend, y no
 * corresponde disparar un borrado por cada foto que se sube.
 */

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { FORM_RULES } from '@/constants/forms'

export const IMAGE_OPTIMIZATION = {
  maxWidth: 1200,
  webpQuality: 85,
  removeMetadata: true,
}

/**
 * Techo del payload, derivado de las reglas del formulario para que no se
 * desincronice: 2 fotos obligatorias + 8 extra, 10 MB cada una, más un
 * margen para los campos de texto.
 */
export const MAX_UPLOAD_BYTES =
  (FORM_RULES.REQUIRED_PHOTOS + FORM_RULES.MAX_EXTRA_PHOTOS) * FORM_RULES.MAX_FILE_SIZE +
  1 * 1024 * 1024

/**
 * Tope de píxeles por imagen. Una foto de cámara ronda los 50 MP; una bomba
 * de descompresión declara miles de millones. 80 MP deja pasar cualquier
 * imagen real y corta el abuso antes de que Sharp reserve memoria.
 */
export const MAX_INPUT_PIXELS = 80_000_000

/**
 * Portero del endpoint. Corre ANTES de leer el body: si no hay credencial,
 * el servidor no gasta nada.
 *
 * @returns {{ ok: true, authHeader: string } | { ok: false, response: NextResponse }}
 */
export function requireBearerToken(request, log) {
  const authHeader =
    request.headers.get('authorization') || request.headers.get('Authorization')

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : ''

  if (!token) {
    // Sin datos del token en el log: alcanza con saber que llegó sin credencial.
    log.warn('Rechazado sin credencial antes de procesar el body')
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No autorizado', message: 'Falta el token de autenticación.' },
        { status: 401 },
      ),
    }
  }

  return { ok: true, authHeader }
}

/**
 * Corta por tamaño declarado antes de leer el body.
 *
 * @returns {{ ok: true } | { ok: false, response: NextResponse }}
 */
export function checkPayloadSize(request, log) {
  const declared = Number(request.headers.get('content-length') || 0)

  if (declared > MAX_UPLOAD_BYTES) {
    const mb = (n) => (n / 1024 / 1024).toFixed(1)
    log.warn(`Rechazado por tamaño: ${mb(declared)} MB (máximo ${mb(MAX_UPLOAD_BYTES)} MB)`)
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Payload demasiado grande',
          message: `El envío supera el máximo de ${mb(MAX_UPLOAD_BYTES)} MB.`,
        },
        { status: 413 },
      ),
    }
  }

  return { ok: true }
}

export function isImageFile(value) {
  if (!value || typeof value !== 'object') return false

  const hasFileProperties =
    'stream' in value || 'arrayBuffer' in value || 'type' in value
  if (!hasFileProperties) return false

  return String(value.type || '').startsWith('image/')
}

/**
 * Optimiza con Sharp. Devuelve null si falla, para que el llamador reenvíe
 * el original (comportamiento previo, se mantiene).
 */
export async function optimizeImage(file, log) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const metadata = await sharp(inputBuffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    }).metadata()
    const originalWidth = metadata.width || Infinity
    const targetWidth = Math.min(originalWidth, IMAGE_OPTIMIZATION.maxWidth)

    const optimizedBuffer = await sharp(inputBuffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .resize(targetWidth, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: IMAGE_OPTIMIZATION.webpQuality })
      .toBuffer()

    const originalSize = inputBuffer.length
    const optimizedSize = optimizedBuffer.length
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1)
    log.debug(
      `Imagen optimizada: ${file.name || 'unknown'} · ` +
        `${(originalSize / 1024).toFixed(2)} KB → ${(optimizedSize / 1024).toFixed(2)} KB (-${reduction}%)`,
    )

    return optimizedBuffer
  } catch (error) {
    log.error('Error optimizando imagen con Sharp:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      errorMessage: error.message,
    })
    return null
  }
}

/**
 * Recorre el FormData optimizando imágenes y dejando el resto igual.
 */
export async function processFormData(formData, log) {
  const processedFormData = new FormData()

  for (const [key, value] of formData.entries()) {
    if (!isImageFile(value)) {
      processedFormData.append(key, value)
      continue
    }

    const optimizedBuffer = await optimizeImage(value, log)

    if (optimizedBuffer) {
      const originalName = value.name || 'image.webp'
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
      const newFileName = `${nameWithoutExt}.webp`

      processedFormData.append(
        key,
        new File([optimizedBuffer], newFileName, {
          type: 'image/webp',
          lastModified: value.lastModified || Date.now(),
        }),
      )
      log.debug(`Imagen optimizada agregada: ${key} → ${newFileName}`)
    } else {
      log.warn(`Sharp falló para ${key}, se reenvía el archivo original`)
      processedFormData.append(key, value)
    }
  }

  return processedFormData
}

/**
 * Headers a reenviar al backend. Nunca loguea el token.
 */
export function buildForwardHeaders(request, authHeader) {
  const headers = new Headers()
  headers.set('Authorization', authHeader)

  for (const headerName of ['accept', 'user-agent']) {
    const headerValue = request.headers.get(headerName)
    if (headerValue) headers.set(headerName, headerValue)
  }

  // Content-Type lo setea fetch solo para FormData (necesita el boundary).
  return headers
}
