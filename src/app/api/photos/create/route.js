/**
 * API Route: /api/photos/create
 *
 * Proxy intermediario que optimiza las imágenes antes de mandarlas al backend.
 *
 * Flujo:
 * 1. Exige un Bearer válido ANTES de leer el body. Sin credencial no se gasta
 *    nada de servidor (antes se corría Sharp y recién después se miraba el
 *    header: era la vulnerabilidad crítica del relevamiento).
 * 2. Corta por tamaño declarado.
 * 3. Optimiza cada imagen con Sharp y reenvía el resto de los campos igual.
 * 4. Reenvía al backend y devuelve su respuesta tal cual.
 *
 * La lógica de optimización vive en @/lib/photos/uploadPipeline, compartida
 * con /api/photos/update/[id], que hacía exactamente lo mismo duplicado.
 *
 * Logging: detalles → log.debug (silenciados en producción salvo API_DEBUG),
 * anomalías recuperables → log.warn, fallos → log.error. Nunca se loguea el
 * token, ni siquiera parcialmente.
 *
 * @author Indiana Usados
 * @version 2.0.0 - Auth previa + pipeline compartido
 */

import { NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/config/api'
import { createLogger } from '@/lib/logger'
import {
  requireBearerToken,
  checkPayloadSize,
  processFormData,
  buildForwardHeaders,
} from '@/lib/photos/uploadPipeline'

const log = createLogger('photos/create')

// ✅ Forzar runtime Node.js (requerido para Sharp)
export const runtime = 'nodejs'

/**
 * Handler POST
 */
export async function POST(request) {
  // ── Portero: antes de tocar el body ──────────────────────────────────────
  const auth = requireBearerToken(request, log)
  if (!auth.ok) return auth.response

  const size = checkPayloadSize(request, log)
  if (!size.ok) return size.response

  try {
    const incomingFormData = await request.formData()
    const processedFormData = await processFormData(incomingFormData, log)

    const backendURL = `${getApiBaseUrl()}/photos/create`
    log.debug(`Reenviando a backend: ${backendURL}`)

    const backendResponse = await fetch(backendURL, {
      method: 'POST',
      headers: buildForwardHeaders(request, auth.authHeader),
      body: processedFormData,
      // Timeout de 2 minutos (igual que el frontend original)
      signal: AbortSignal.timeout(120000),
    })

    log.info(`Backend respondió ${backendResponse.status} ${backendResponse.statusText}`)

    const responseBody = await backendResponse.text()

    if (!backendResponse.ok) {
      log.error(`El backend rechazó el alta (${backendResponse.status}):`, responseBody.slice(0, 500))
    }

    // ── Respuesta proxy: se reenvía status y body exactos, sin interpretar ──
    const responseHeaders = new Headers()
    for (const [key, value] of backendResponse.headers.entries()) {
      const lowerKey = key.toLowerCase()
      // Excluir headers de transferencia que Next.js maneja automáticamente
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(lowerKey)) {
        responseHeaders.set(key, value)
      }
    }
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('Content-Type', 'application/json')
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    log.error('Error procesando el alta de fotos:', error)

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          error: 'Timeout: La solicitud tardó demasiado tiempo',
          message: 'El backend no respondió en el tiempo esperado',
        },
        { status: 504 },
      )
    }

    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        message: error.message || 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
