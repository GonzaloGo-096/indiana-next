/**
 * Invalida la caché del sitio público (Next) usando la misma sesión del panel.
 * Usado tras alta/edición/baja de vehículos para no depender solo del botón manual.
 */

import { AUTH_CONFIG } from '@/config/auth'
import { createLogger } from '@/lib/logger'

const log = createLogger('admin:revalidate')

/**
 * @param {object} opts
 * @param {string[]} [opts.vehicleIds]
 * @param {boolean} [opts.revalidateList]
 * @param {boolean} [opts.warmup]
 * @returns {Promise<boolean>}
 */
export async function revalidatePublicCache({
  vehicleIds = [],
  revalidateList = true,
  warmup = true,
} = {}) {
  if (typeof window === 'undefined') return false

  let token
  try {
    token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey)?.trim() ?? ''
  } catch {
    return false
  }
  if (!token) return false

  try {
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vehicleIds,
        revalidateList,
        warmup,
      }),
    })
    const data = await response.json().catch(() => ({}))
    const ok = Boolean(response.ok && data.ok === true)

    if (!ok) {
      // Antes esto devolvia false en silencio: si la revalidacion fallaba,
      // el admin creia haber publicado y el sitio publico quedaba viejo sin
      // que nadie se enterara. Es la unica senal de que la cache no se limpio.
      log.error('La revalidacion no se aplico. El sitio publico puede quedar desactualizado.', {
        status: response.status,
        respuesta: data,
        vehicleIds,
      })
    }

    return ok
  } catch (error) {
    log.error('No se pudo llamar a /api/revalidate. El sitio publico puede quedar desactualizado.', {
      message: error?.message || String(error),
      vehicleIds,
    })
    return false
  }
}
