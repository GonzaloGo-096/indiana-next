/**
 * API Route: /api/photos/create
 *
 * Proxy intermediario para optimizar imágenes antes de enviarlas al backend externo.
 *
 * Flujo:
 * 1. Recibe FormData del frontend
 * 2. Procesa cada campo:
 *    - Si es imagen: optimiza con Sharp (redimensiona, convierte a WebP, elimina metadata)
 *    - Si no es imagen: reenvía sin modificar
 * 3. Reconstruye FormData con los mismos nombres de campo
 * 4. Reenvía al backend externo manteniendo headers (Authorization)
 * 5. Devuelve respuesta del backend tal cual
 *
 * Logging:
 *   - Detalles operativos (tamaños, contenido de FormData) → log.debug
 *   - Situaciones anómalas pero recuperables → log.warn
 *   - Fallos del backend o de Sharp → log.error
 *   En producción, los `debug` quedan silenciados salvo que se setee `API_DEBUG=true`.
 *
 * @author Indiana Usados
 * @version 1.0.0
 */

import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getApiBaseUrl } from '@/lib/config/api'
import { createLogger } from '@/lib/logger'

const log = createLogger('photos/create')

// ✅ Forzar runtime Node.js (requerido para Sharp)
export const runtime = 'nodejs'

// ✅ Configuración de optimización de imágenes
// maxWidth 1200: cards ~360px, detalle ~800px, hero 0km sizes=1200px → 1200 cubre todo con margen retina
const IMAGE_OPTIMIZATION = {
  maxWidth: 1200,
  webpQuality: 85,
  removeMetadata: true
}

/**
 * Verificar si un valor es un archivo de imagen
 * @param {any} value - Valor a verificar
 * @returns {boolean}
 */
function isImageFile(value) {
  if (!value || typeof value !== 'object') {
    return false
  }

  // Verificar si es File o tiene propiedades de File
  const hasFileProperties =
    'stream' in value ||
    'arrayBuffer' in value ||
    'type' in value

  if (!hasFileProperties) {
    return false
  }

  // Verificar tipo MIME
  const type = value.type || ''
  return type.startsWith('image/')
}

/**
 * Optimizar imagen usando Sharp
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Buffer|null>} Buffer optimizado o null si falla
 */
async function optimizeImage(file) {
  try {
    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // Obtener metadata original para no agrandar
    const metadata = await sharp(inputBuffer).metadata()
    const originalWidth = metadata.width || Infinity

    // Determinar ancho objetivo (no agrandar)
    const targetWidth = Math.min(originalWidth, IMAGE_OPTIMIZATION.maxWidth)

    // Optimizar con Sharp
    const optimizedBuffer = await sharp(inputBuffer)
      .resize(targetWidth, null, {
        withoutEnlargement: true, // No agrandar imágenes pequeñas
        fit: 'inside' // Mantener aspect ratio
      })
      .webp({
        quality: IMAGE_OPTIMIZATION.webpQuality
      })
      .toBuffer()

    const originalSize = inputBuffer.length
    const optimizedSize = optimizedBuffer.length
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1)
    log.debug(`✅ Imagen optimizada: ${file.name || 'unknown'}`)
    log.debug(`  Original: ${(originalSize / 1024).toFixed(2)} KB`)
    log.debug(`  Optimizado: ${(optimizedSize / 1024).toFixed(2)} KB`)
    log.debug(`  Reducción: ${reduction}%`)

    return optimizedBuffer
  } catch (error) {
    // Si Sharp falla, retornar null para que se use el archivo original
    log.error(`❌ Error optimizando imagen con Sharp:`, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      errorMessage: error.message,
      errorStack: error.stack
    })
    return null // Retornar null para indicar que debe usar el original
  }
}

/**
 * Procesar FormData: optimizar imágenes y mantener otros campos
 * @param {FormData} formData - FormData original
 * @returns {Promise<FormData>} FormData procesado
 */
async function processFormData(formData) {
  const processedFormData = new FormData()

  // Recorrer todos los campos del FormData original
  for (const [key, value] of formData.entries()) {
    if (isImageFile(value)) {
      // ✅ Es una imagen: optimizar
      const optimizedBuffer = await optimizeImage(value)

      if (optimizedBuffer) {
        // ✅ Sharp optimizó exitosamente: crear nuevo File
        const originalName = value.name || 'image.webp'
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
        const newFileName = `${nameWithoutExt}.webp`

        const optimizedFile = new File(
          [optimizedBuffer],
          newFileName,
          {
            type: 'image/webp',
            lastModified: value.lastModified || Date.now()
          }
        )

        processedFormData.append(key, optimizedFile)
        log.debug(`✅ Imagen optimizada agregada: ${key} -> ${newFileName}`)
      } else {
        // ✅ Sharp falló, reenviar archivo original
        log.warn(`⚠️ Sharp falló para ${key}, reenviando archivo original`)
        processedFormData.append(key, value)
      }
    } else {
      // ✅ No es imagen: reenviar sin modificar
      processedFormData.append(key, value)
    }
  }

  return processedFormData
}

/**
 * Handler POST
 *
 * Recibe FormData del frontend, optimiza imágenes, y reenvía al backend externo.
 */
export async function POST(request) {
  try {
    // ✅ Leer FormData del request
    const incomingFormData = await request.formData()

    // ✅ LOGGEAR FORMDATA ENTRANTE
    // IMPORTANTE: FormData solo se puede iterar una vez, así que guardamos las entradas primero
    log.debug('=== FORMDATA ENTRANTE ===')
    const incomingEntries = []
    const incomingKeys = []

    for (const [key, value] of incomingFormData.entries()) {
      // Guardar entrada para reconstruir FormData después
      incomingEntries.push([key, value])

      // Loggear detalles
      if (value instanceof File) {
        const sizeMB = (value.size / 1024 / 1024).toFixed(2)
        log.debug(`[key] ${key} → File(${value.type}, ${sizeMB}MB, name: ${value.name || 'unnamed'})`)
        incomingKeys.push({ key, type: 'File', fileType: value.type, size: value.size, name: value.name })
      } else {
        const valueStr = String(value).substring(0, 100) // Limitar a 100 chars para logs
        log.debug(`[key] ${key} → "${valueStr}${String(value).length > 100 ? '...' : ''}"`)
        incomingKeys.push({ key, type: 'text', value: valueStr })
      }
    }
    log.debug(`Total campos entrantes: ${incomingKeys.length}`)
    log.debug('=== FIN FORMDATA ENTRANTE ===\n')

    // ✅ Reconstruir FormData para procesarlo (ya que fue consumido al iterar)
    const formDataToProcess = new FormData()
    for (const [key, value] of incomingEntries) {
      formDataToProcess.append(key, value)
    }

    // ✅ Procesar FormData (optimizar imágenes)
    const processedFormData = await processFormData(formDataToProcess)

    // ✅ LOGGEAR FORMDATA RECONSTRUIDO
    log.debug('=== FORMDATA RECONSTRUIDO ===')
    const processedKeys = []
    for (const [key, value] of processedFormData.entries()) {
      if (value instanceof File) {
        const sizeMB = (value.size / 1024 / 1024).toFixed(2)
        log.debug(`[key] ${key} → File(${value.type}, ${sizeMB}MB, name: ${value.name || 'unnamed'})`)
        processedKeys.push({ key, type: 'File', fileType: value.type, size: value.size, name: value.name })
      } else {
        const valueStr = String(value).substring(0, 100)
        log.debug(`[key] ${key} → "${valueStr}${String(value).length > 100 ? '...' : ''}"`)
        processedKeys.push({ key, type: 'text', value: valueStr })
      }
    }
    log.debug(`Total campos reconstruidos: ${processedKeys.length}`)

    // ✅ Verificar que coincidan las keys
    const incomingKeySet = new Set(incomingKeys.map(k => k.key))
    const processedKeySet = new Set(processedKeys.map(k => k.key))
    const missingKeys = Array.from(incomingKeySet).filter(k => !processedKeySet.has(k))
    const extraKeys = Array.from(processedKeySet).filter(k => !incomingKeySet.has(k))

    if (missingKeys.length > 0) {
      log.warn(`⚠️ Keys faltantes en FormData reconstruido: ${missingKeys.join(', ')}`)
    }
    if (extraKeys.length > 0) {
      log.warn(`⚠️ Keys extra en FormData reconstruido: ${extraKeys.join(', ')}`)
    }
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      log.debug('✅ Todas las keys coinciden entre FormData entrante y reconstruido')
    }
    log.debug('=== FIN FORMDATA RECONSTRUIDO ===\n')

    // ✅ VERIFICAR Y REENVIAR AUTHORIZATION
    const headers = new Headers()

    // Copiar header de Authorization si existe
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
      log.debug(`✅ Header Authorization encontrado y reenviado (${authHeader.substring(0, 20)}...)`)
    } else {
      log.warn(`⚠️ Header Authorization NO encontrado en request`)
    }

    // Copiar otros headers relevantes (excepto Content-Type que se setea automáticamente)
    const relevantHeaders = ['accept', 'user-agent']
    for (const headerName of relevantHeaders) {
      const headerValue = request.headers.get(headerName)
      if (headerValue) {
        headers.set(headerName, headerValue)
      }
    }

    // ✅ NO setear Content-Type manualmente - fetch lo hace automáticamente para FormData

    // ✅ Construir URL del backend externo
    const backendBaseURL = getApiBaseUrl()
    const backendURL = `${backendBaseURL}/photos/create`

    log.debug(`Reenviando a backend: ${backendURL}`)
    log.debug(`Headers enviados:`, Object.fromEntries(headers.entries()))

    // ✅ LOGGEAR FORMDATA FINAL ANTES DE ENVIAR AL BACKEND
    log.debug('=== FORMDATA FINAL (antes de fetch) ===')
    const finalFormDataEntries = []
    for (const [key, value] of processedFormData.entries()) {
      if (value instanceof File) {
        const sizeKB = (value.size / 1024).toFixed(2)
        const sizeMB = (value.size / 1024 / 1024).toFixed(2)
        log.debug(`  - ${key}: File (name=${value.name || 'unnamed'}, size=${value.size} bytes / ${sizeKB} KB / ${sizeMB} MB, type=${value.type || 'unknown'})`)
        finalFormDataEntries.push({
          key,
          type: 'File',
          name: value.name || 'unnamed',
          size: value.size,
          sizeKB: parseFloat(sizeKB),
          sizeMB: parseFloat(sizeMB),
          mimeType: value.type || 'unknown'
        })
      } else {
        const valueStr = String(value)
        const preview = valueStr.length > 50 ? valueStr.substring(0, 50) + '...' : valueStr
        log.debug(`  - ${key}: string (value="${preview}", length=${valueStr.length})`)
        finalFormDataEntries.push({
          key,
          type: 'string',
          value: valueStr,
          length: valueStr.length
        })
      }
    }
    log.debug(`Total campos en FormData final: ${finalFormDataEntries.length}`)
    const fileCount = finalFormDataEntries.filter(e => e.type === 'File').length
    const stringCount = finalFormDataEntries.filter(e => e.type === 'string').length
    log.debug(`  - Archivos: ${fileCount}`)
    log.debug(`  - Strings: ${stringCount}`)

    // ✅ Verificar campos críticos
    const criticalFields = ['marca', 'modelo', 'precio', 'anio', 'caja', 'kilometraje', 'fotoPrincipal', 'fotoHover']
    const presentFields = finalFormDataEntries.map(e => e.key)
    const missingCritical = criticalFields.filter(field => !presentFields.includes(field))
    if (missingCritical.length > 0) {
      log.warn(`⚠️ Campos críticos faltantes: ${missingCritical.join(', ')}`)
    } else {
      log.debug(`✅ Todos los campos críticos presentes`)
    }

    // ✅ Verificar tamaños de archivos
    const files = finalFormDataEntries.filter(e => e.type === 'File')
    if (files.length > 0) {
      const totalSizeMB = files.reduce((sum, f) => sum + f.sizeMB, 0)
      const maxFileSizeMB = Math.max(...files.map(f => f.sizeMB))
      const minFileSizeMB = Math.min(...files.map(f => f.sizeMB))
      log.debug(`📊 Estadísticas de archivos:`)
      log.debug(`  - Total archivos: ${files.length}`)
      log.debug(`  - Tamaño total: ${totalSizeMB.toFixed(2)} MB`)
      log.debug(`  - Archivo más grande: ${maxFileSizeMB.toFixed(2)} MB`)
      log.debug(`  - Archivo más pequeño: ${minFileSizeMB.toFixed(2)} MB`)

      // Advertir si hay archivos muy grandes o muy pequeños
      if (maxFileSizeMB > 50) {
        log.warn(`⚠️ Archivo muy grande detectado: ${maxFileSizeMB.toFixed(2)} MB`)
      }
      if (minFileSizeMB < 0.01) {
        log.warn(`⚠️ Archivo muy pequeño detectado: ${minFileSizeMB.toFixed(2)} MB (posible archivo corrupto)`)
      }
    }

    log.debug('=== FIN FORMDATA FINAL ===\n')

    // ✅ Reenviar al backend externo
    const backendResponse = await fetch(backendURL, {
      method: 'POST',
      headers: headers,
      body: processedFormData,
      // Timeout de 2 minutos (igual que el frontend original)
      signal: AbortSignal.timeout(120000)
    })

    // ✅ LOGGEAR RESPUESTA DEL BACKEND EXTERNO
    log.debug('=== RESPUESTA DEL BACKEND ===')
    log.info(`Status: ${backendResponse.status} ${backendResponse.statusText}`)
    log.debug(`Headers de respuesta:`, Object.fromEntries(backendResponse.headers.entries()))

    // Leer respuesta del backend como texto (sin parsear)
    const responseBody = await backendResponse.text()

    // Loggear contenido de la respuesta (limitado para no saturar logs)
    const responsePreview = responseBody.length > 500
      ? responseBody.substring(0, 500) + '...'
      : responseBody
    log.debug(`Response body (${responseBody.length} chars):`, responsePreview)

    // Si es error 400, loggear detalles completos
    if (backendResponse.status === 400) {
      log.error('❌ Backend respondió 400 Bad Request')
      log.error('Response completa:', responseBody)
      log.error('Verificar:')
      log.error('  - ¿Todos los campos requeridos están presentes?')
      log.error('  - ¿Los archivos tienen el formato correcto?')
      log.error('  - ¿El header Authorization es válido?')
    }
    log.debug('=== FIN RESPUESTA DEL BACKEND ===\n')

    // ✅ IMPLEMENTAR RESPUESTA PROXY CORRECTA
    // Reenviar EXACTAMENTE el status y body del backend sin interpretar

    // Copiar headers del backend (excluyendo headers de transferencia que Next.js maneja)
    const responseHeaders = new Headers()
    for (const [key, value] of backendResponse.headers.entries()) {
      const lowerKey = key.toLowerCase()
      // Excluir headers de transferencia que Next.js maneja automáticamente
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(lowerKey)) {
        responseHeaders.set(key, value)
      }
    }

    // Asegurar Content-Type (usar el del backend o fallback a application/json)
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('Content-Type', 'application/json')
    }

    // Crear respuesta con el body exacto del backend
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders
    })

  } catch (error) {
    // ✅ Manejo de errores
    log.error('Error:', error)

    // Si es error de timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          error: 'Timeout: La solicitud tardó demasiado tiempo',
          message: 'El backend no respondió en el tiempo esperado'
        },
        { status: 504 }
      )
    }

    // Error genérico
    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
        message: error.message || 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
