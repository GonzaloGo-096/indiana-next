/**
 * API Route: /api/revalidate
 * 
 * Revalida tags de Next.js y hace warmup de URLs
 * 
 * ⚠️ SEGURIDAD:
 * Este endpoint usa REVALIDATE_SECRET (solo server-side) porque el login actual
 * NO es validable en el servidor (solo client-side con localStorage).
 * 
 * ⚠️ SOLUCIÓN TEMPORAL: Para producción, debería migrarse a autenticación server-side
 * (cookies httpOnly, NextAuth, o middleware de auth) y eliminar el secret manual.
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Secret solo en server, validación mejorada
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

// ✅ CONFIGURACIÓN
// ⚠️ REVALIDATE_SECRET solo en .env.local (NO usar NEXT_PUBLIC_)
// ⚠️ SIN FALLBACK: Si no existe, el endpoint fallará explícitamente (seguridad)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET // ⚠️ Sin fallback - debe estar configurado
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
    // ✅ VALIDAR CONFIGURACIÓN DEL SECRET (OBLIGATORIO)
    // ⚠️ Si REVALIDATE_SECRET no está configurado, el endpoint NO debe funcionar
    if (!REVALIDATE_SECRET || REVALIDATE_SECRET.trim() === '') {
      const tookMs = Date.now() - startTime
      return NextResponse.json(
        {
          ok: false,
          error: 'Server configuration error: REVALIDATE_SECRET is not configured. Please set REVALIDATE_SECRET in .env.local',
          tookMs
        },
        { status: 500 }
      )
    }

    // ✅ VALIDAR SECRET DEL REQUEST (solo server-side, NO usar NEXT_PUBLIC_)
    // ⚠️ TEMPORAL: En producción migrar a auth server-side (cookies/sesión)
    const secret = request.headers.get('x-revalidate-secret')
    if (!secret || secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid secret' },
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
      const urlsToWarmup = []

      // Agregar URL de lista (si revalidateList es true, incluso si vehicleIds está vacío)
      if (revalidateList) {
        urlsToWarmup.push(`${BASE_URL}/usados/vehiculos`)
      }

      // Agregar URLs de detalle (solo si hay IDs)
      for (const id of vehicleIds) {
        urlsToWarmup.push(`${BASE_URL}/usados/${id}`)
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
    requiresSecret: true,
    method: 'POST'
  })
}

