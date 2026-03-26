/**
 * API Route: /api/revalidate
 *
 * Revalida tags de Next.js y hace warmup de URLs
 *
 * Autenticación (cualquiera de las dos):
 * 1) Header `x-revalidate-secret` === REVALIDATE_SECRET (cron, CLI, integraciones)
 * 2) Header `Authorization: Bearer <JWT>` validado contra el backend (panel admin)
 *
 * @author Indiana Usados
 * @version 3.0.0 - Bearer de admin + secret para automatización
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/site-url'
import { verifyAdminBearerToken } from '@/lib/auth/verifyAdminBearerServer'

// ✅ CONFIGURACIÓN
// REVALIDATE_SECRET: obligatorio solo si usás el header x-revalidate-secret (cron, CLI).
// El panel admin puede usar solo Bearer; en ese caso no hace falta definir esta variable.
const REVALIDATE_SECRET = (process.env.REVALIDATE_SECRET || '').trim()
const MAX_WARMUP_IDS = 15
const WARMUP_BATCH_SIZE = 5

/**
 * Función helper para hacer warmup de una URL
 * 
 * ⚠️ ROBUSTEZ: Los errores de warmup NO invalidan la revalidación (best-effort).
 * Si un vehículo fue eliminado o no existe, el warmup falla pero la revalidación
 * ya se completó exitosamente.
 * 
 * @param {string} url - URL a calentar
 * @returns {Promise<boolean>} true si fue exitoso
 */
async function warmupUrl(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      // No esperamos la respuesta completa, solo iniciamos la petición
      signal: AbortSignal.timeout(5000), // timeout de 5s por URL
    })
    return response.ok
  } catch (error) {
    // ✅ IGNORAR ERRORES: El warmup es "fire and forget" (best-effort)
    // Si un vehículo fue eliminado (404) o hay timeout, no afecta la revalidación
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[revalidate] Warmup falló para ${url}:`, error.message)
    }
    return false
  }
}

/**
 * Hacer warmup de URLs en batches paralelos
 * @param {string[]} urls - URLs a calentar
 * @returns {Promise<{ warmed: number, total: number }>}
 */
async function warmupUrls(urls) {
  if (!urls || urls.length === 0) {
    return { warmed: 0, total: 0 }
  }

  // Limitar cantidad de URLs
  const urlsToWarmup = urls.slice(0, MAX_WARMUP_IDS)
  
  let warmed = 0
  let total = urlsToWarmup.length

  // Procesar en batches paralelos
  for (let i = 0; i < urlsToWarmup.length; i += WARMUP_BATCH_SIZE) {
    const batch = urlsToWarmup.slice(i, i + WARMUP_BATCH_SIZE)
    const results = await Promise.allSettled(batch.map(url => warmupUrl(url)))
    
    // Contar exitosos
    warmed += results.filter(r => r.status === 'fulfilled' && r.value === true).length
    
    // Pequeña pausa entre batches para no sobrecargar
    if (i + WARMUP_BATCH_SIZE < urlsToWarmup.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return { warmed, total }
}

/**
 * POST /api/revalidate
 * 
 * Body esperado:
 * {
 *   vehicleIds: string[],  // IDs de vehículos a revalidar
 *   revalidateList: boolean, // Si revalidar la lista completa
 *   warmup: boolean  // Si hacer warmup de URLs
 * }
 */
export async function POST(request) {
  const startTime = Date.now()

  try {
    // ✅ Autorización: secret (automatización) O JWT de admin validado en backend
    const secretHeaderRaw = request.headers.get('x-revalidate-secret')
    const secretHeader = (secretHeaderRaw || '').trim()
    const authHeader = request.headers.get('authorization') || ''
    const bearerToken =
      authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    // Si mandan el header de secret, el servidor debe tener REVALIDATE_SECRET configurado
    if (secretHeader.length > 0 && !REVALIDATE_SECRET) {
      const tookMs = Date.now() - startTime
      return NextResponse.json(
        {
          ok: false,
          error:
            'Server configuration error: se envió x-revalidate-secret pero REVALIDATE_SECRET no está definido en el servidor',
          tookMs,
        },
        { status: 500 }
      )
    }

    const secretOk =
      secretHeader.length > 0 && REVALIDATE_SECRET && secretHeader === REVALIDATE_SECRET
    const bearerOk =
      bearerToken.length > 0 && (await verifyAdminBearerToken(bearerToken))

    if (!secretOk && !bearerOk) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: enviá x-revalidate-secret o Authorization Bearer con sesión de admin válida',
        },
        { status: 401 }
      )
    }

    // ✅ PARSEAR BODY
    const body = await request.json()
    const { vehicleIds = [], revalidateList = true, warmup = true } = body

    if (!Array.isArray(vehicleIds)) {
      return NextResponse.json(
        { error: 'vehicleIds debe ser un array' },
        { status: 400 }
      )
    }

    // ✅ REVALIDAR TAGS
    const revalidated = []

    // Revalidar lista de vehículos
    if (revalidateList) {
      revalidateTag('vehicles-list')
      revalidated.push('vehicles-list')
    }

    // Revalidar vehículos individuales
    for (const id of vehicleIds) {
      const tag = `vehicle:${id}`
      revalidateTag(tag)
      revalidated.push(tag)
    }

    // ✅ HACER WARMUP (si está habilitado)
    let warmedResult = { warmed: 0, total: 0 }
    
    if (warmup) {
      // Usar getSiteUrl() como fuente única de verdad (soporta preview automáticamente)
      const baseUrl = getSiteUrl()
      const urlsToWarmup = []

      // Agregar URL de lista (si revalidateList es true, incluso si vehicleIds está vacío)
      if (revalidateList) {
        urlsToWarmup.push(`${baseUrl}/usados/vehiculos`)
      }

      // Agregar URLs de detalle (solo si hay IDs)
      for (const id of vehicleIds) {
        urlsToWarmup.push(`${baseUrl}/usados/${id}`)
      }

      // Hacer warmup si hay URLs (lista o detalles)
      if (urlsToWarmup.length > 0) {
        warmedResult = await warmupUrls(urlsToWarmup)
      }
    }

    // ✅ CALCULAR TIEMPO
    const tookMs = Date.now() - startTime

    // ✅ RESPUESTA
    return NextResponse.json({
      ok: true,
      tookMs,
      revalidated: revalidated.length,
      revalidatedTags: revalidated,
      warmed: warmedResult.warmed,
      warmedTotal: warmedResult.total,
      vehicleIds: vehicleIds.length
    })
  } catch (error) {
    const tookMs = Date.now() - startTime

    if (process.env.NODE_ENV === 'development') {
      console.error('[revalidate] Error:', error)
    }

    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Error desconocido',
        tookMs
      },
      { status: 500 }
    )
  }
}

// ✅ GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    message: 'Revalidate endpoint está activo',
    auth: ['x-revalidate-secret', 'Authorization: Bearer (JWT admin válido)'],
    method: 'POST',
  })
}

