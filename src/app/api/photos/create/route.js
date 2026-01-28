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
 * @author Indiana Usados
 * @version 1.0.0
 */

import { NextResponse } from 'next/server'
import sharp from 'sharp'

// ✅ Forzar runtime Node.js (requerido para Sharp)
export const runtime = 'nodejs'

// ✅ Configuración de optimización de imágenes
const IMAGE_OPTIMIZATION = {
  // Ancho máximo (no agrandar imágenes más pequeñas)
  maxWidth: 1920,
  // Calidad WebP (0-100)
  webpQuality: 85,
  // Eliminar metadata
  removeMetadata: true
}

/**
 * Obtener base URL del backend externo
 * Prioridad: API_URL (server-only) > NEXT_PUBLIC_API_URL
 */
function getBackendBaseURL() {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001'
  )
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
    console.log(`[photos/create] ✅ Imagen optimizada: ${file.name || 'unknown'}`)
    console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`)
    console.log(`  Optimizado: ${(optimizedSize / 1024).toFixed(2)} KB`)
    console.log(`  Reducción: ${reduction}%`)
    
    return optimizedBuffer
  } catch (error) {
    // ✅ TAREA 4: MANEJO CORRECTO DE ERRORES DE SHARP
    // Si Sharp falla, retornar null para que se use el archivo original
    console.error(`[photos/create] ❌ Error optimizando imagen con Sharp:`, {
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
        console.log(`[photos/create] ✅ Imagen optimizada agregada: ${key} -> ${newFileName}`)
      } else {
        // ✅ TAREA 4: Sharp falló, reenviar archivo original
        console.warn(`[photos/create] ⚠️ Sharp falló para ${key}, reenviando archivo original`)
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
    
    // ✅ TAREA 1: LOGGEAR FORMDATA ENTRANTE
    // IMPORTANTE: FormData solo se puede iterar una vez, así que guardamos las entradas primero
    console.log('=== [photos/create] FORMDATA ENTRANTE ===')
    const incomingEntries = []
    const incomingKeys = []
    
    for (const [key, value] of incomingFormData.entries()) {
      // Guardar entrada para reconstruir FormData después
      incomingEntries.push([key, value])
      
      // Loggear detalles
      if (value instanceof File) {
        const sizeMB = (value.size / 1024 / 1024).toFixed(2)
        console.log(`[key] ${key} → File(${value.type}, ${sizeMB}MB, name: ${value.name || 'unnamed'})`)
        incomingKeys.push({ key, type: 'File', fileType: value.type, size: value.size, name: value.name })
      } else {
        const valueStr = String(value).substring(0, 100) // Limitar a 100 chars para logs
        console.log(`[key] ${key} → "${valueStr}${String(value).length > 100 ? '...' : ''}"`)
        incomingKeys.push({ key, type: 'text', value: valueStr })
      }
    }
    console.log(`Total campos entrantes: ${incomingKeys.length}`)
    console.log('=== FIN FORMDATA ENTRANTE ===\n')
    
    // ✅ Reconstruir FormData para procesarlo (ya que fue consumido al iterar)
    const formDataToProcess = new FormData()
    for (const [key, value] of incomingEntries) {
      formDataToProcess.append(key, value)
    }
    
    // ✅ Procesar FormData (optimizar imágenes)
    const processedFormData = await processFormData(formDataToProcess)
    
    // ✅ TAREA 2: LOGGEAR FORMDATA RECONSTRUIDO
    console.log('=== [photos/create] FORMDATA RECONSTRUIDO ===')
    const processedKeys = []
    for (const [key, value] of processedFormData.entries()) {
      if (value instanceof File) {
        const sizeMB = (value.size / 1024 / 1024).toFixed(2)
        console.log(`[key] ${key} → File(${value.type}, ${sizeMB}MB, name: ${value.name || 'unnamed'})`)
        processedKeys.push({ key, type: 'File', fileType: value.type, size: value.size, name: value.name })
      } else {
        const valueStr = String(value).substring(0, 100)
        console.log(`[key] ${key} → "${valueStr}${String(value).length > 100 ? '...' : ''}"`)
        processedKeys.push({ key, type: 'text', value: valueStr })
      }
    }
    console.log(`Total campos reconstruidos: ${processedKeys.length}`)
    
    // ✅ Verificar que coincidan las keys
    const incomingKeySet = new Set(incomingKeys.map(k => k.key))
    const processedKeySet = new Set(processedKeys.map(k => k.key))
    const missingKeys = Array.from(incomingKeySet).filter(k => !processedKeySet.has(k))
    const extraKeys = Array.from(processedKeySet).filter(k => !incomingKeySet.has(k))
    
    if (missingKeys.length > 0) {
      console.warn(`⚠️ Keys faltantes en FormData reconstruido: ${missingKeys.join(', ')}`)
    }
    if (extraKeys.length > 0) {
      console.warn(`⚠️ Keys extra en FormData reconstruido: ${extraKeys.join(', ')}`)
    }
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log('✅ Todas las keys coinciden entre FormData entrante y reconstruido')
    }
    console.log('=== FIN FORMDATA RECONSTRUIDO ===\n')
    
    // ✅ TAREA 3: VERIFICAR Y REENVIAR AUTHORIZATION
    const headers = new Headers()
    
    // Copiar header de Authorization si existe
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader) {
      headers.set('Authorization', authHeader)
      console.log(`[photos/create] ✅ Header Authorization encontrado y reenviado (${authHeader.substring(0, 20)}...)`)
    } else {
      console.warn(`[photos/create] ⚠️ Header Authorization NO encontrado en request`)
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
    const backendBaseURL = getBackendBaseURL()
    const backendURL = `${backendBaseURL}/photos/create`
    
    console.log(`[photos/create] Reenviando a backend: ${backendURL}`)
    console.log(`[photos/create] Headers enviados:`, Object.fromEntries(headers.entries()))
    
    // ✅ LOGGEAR FORMDATA FINAL ANTES DE ENVIAR AL BACKEND
    console.log('=== [photos/create] FORMDATA FINAL (antes de fetch) ===')
    const finalFormDataEntries = []
    for (const [key, value] of processedFormData.entries()) {
      if (value instanceof File) {
        const sizeKB = (value.size / 1024).toFixed(2)
        const sizeMB = (value.size / 1024 / 1024).toFixed(2)
        console.log(`  - ${key}: File (name=${value.name || 'unnamed'}, size=${value.size} bytes / ${sizeKB} KB / ${sizeMB} MB, type=${value.type || 'unknown'})`)
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
        console.log(`  - ${key}: string (value="${preview}", length=${valueStr.length})`)
        finalFormDataEntries.push({
          key,
          type: 'string',
          value: valueStr,
          length: valueStr.length
        })
      }
    }
    console.log(`Total campos en FormData final: ${finalFormDataEntries.length}`)
    const fileCount = finalFormDataEntries.filter(e => e.type === 'File').length
    const stringCount = finalFormDataEntries.filter(e => e.type === 'string').length
    console.log(`  - Archivos: ${fileCount}`)
    console.log(`  - Strings: ${stringCount}`)
    
    // ✅ Verificar campos críticos
    const criticalFields = ['marca', 'modelo', 'precio', 'anio', 'caja', 'kilometraje', 'fotoPrincipal', 'fotoHover']
    const presentFields = finalFormDataEntries.map(e => e.key)
    const missingCritical = criticalFields.filter(field => !presentFields.includes(field))
    if (missingCritical.length > 0) {
      console.warn(`⚠️ [photos/create] Campos críticos faltantes: ${missingCritical.join(', ')}`)
    } else {
      console.log(`✅ [photos/create] Todos los campos críticos presentes`)
    }
    
    // ✅ Verificar tamaños de archivos
    const files = finalFormDataEntries.filter(e => e.type === 'File')
    if (files.length > 0) {
      const totalSizeMB = files.reduce((sum, f) => sum + f.sizeMB, 0)
      const maxFileSizeMB = Math.max(...files.map(f => f.sizeMB))
      const minFileSizeMB = Math.min(...files.map(f => f.sizeMB))
      console.log(`📊 [photos/create] Estadísticas de archivos:`)
      console.log(`  - Total archivos: ${files.length}`)
      console.log(`  - Tamaño total: ${totalSizeMB.toFixed(2)} MB`)
      console.log(`  - Archivo más grande: ${maxFileSizeMB.toFixed(2)} MB`)
      console.log(`  - Archivo más pequeño: ${minFileSizeMB.toFixed(2)} MB`)
      
      // Advertir si hay archivos muy grandes o muy pequeños
      if (maxFileSizeMB > 50) {
        console.warn(`⚠️ [photos/create] Archivo muy grande detectado: ${maxFileSizeMB.toFixed(2)} MB`)
      }
      if (minFileSizeMB < 0.01) {
        console.warn(`⚠️ [photos/create] Archivo muy pequeño detectado: ${minFileSizeMB.toFixed(2)} MB (posible archivo corrupto)`)
      }
    }
    
    console.log('=== FIN FORMDATA FINAL ===\n')
    
    // ✅ Reenviar al backend externo
    const backendResponse = await fetch(backendURL, {
      method: 'POST',
      headers: headers,
      body: processedFormData,
      // Timeout de 2 minutos (igual que el frontend original)
      signal: AbortSignal.timeout(120000)
    })
    
    // ✅ TAREA 5: LOGGEAR RESPUESTA DEL BACKEND EXTERNO
    console.log('=== [photos/create] RESPUESTA DEL BACKEND ===')
    console.log(`Status: ${backendResponse.status} ${backendResponse.statusText}`)
    console.log(`Headers de respuesta:`, Object.fromEntries(backendResponse.headers.entries()))
    
    // Leer respuesta del backend como texto (sin parsear)
    const responseBody = await backendResponse.text()
    
    // Loggear contenido de la respuesta (limitado para no saturar logs)
    const responsePreview = responseBody.length > 500 
      ? responseBody.substring(0, 500) + '...' 
      : responseBody
    console.log(`Response body (${responseBody.length} chars):`, responsePreview)
    
    // Si es error 400, loggear detalles completos
    if (backendResponse.status === 400) {
      console.error('❌ [photos/create] Backend respondió 400 Bad Request')
      console.error('Response completa:', responseBody)
      console.error('Verificar:')
      console.error('  - ¿Todos los campos requeridos están presentes?')
      console.error('  - ¿Los archivos tienen el formato correcto?')
      console.error('  - ¿El header Authorization es válido?')
    }
    console.log('=== FIN RESPUESTA DEL BACKEND ===\n')
    
    // ✅ TAREA 2: IMPLEMENTAR RESPUESTA PROXY CORRECTA
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
    if (process.env.NODE_ENV === 'development') {
      console.error('[photos/create] Error:', error)
    }
    
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

