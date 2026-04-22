/**
 * Invalida la caché del sitio público (Next) usando la misma sesión del panel.
 * Usado tras alta/edición/baja de vehículos para no depender solo del botón manual.
 */

import { AUTH_CONFIG } from '@/config/auth'

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
    return Boolean(response.ok && data.ok === true)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[revalidatePublicCache]', error)
    }
    return false
  }
}
