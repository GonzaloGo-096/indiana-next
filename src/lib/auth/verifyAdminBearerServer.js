/**
 * Verifica que un JWT de admin sea aceptado por el backend (solo servidor).
 *
 * No conocemos un endpoint dedicado "verify"; usamos DELETE a un id inválido fijo:
 * - 401 / 403 → token inválido o sin permiso
 * - 5xx → no asumimos auth (falla cerrada)
 * - 2xx / 404 / 400 / etc. → el backend rechazó el recurso pero aceptó la identidad
 *
 * Id por defecto: 24 ceros (ObjectId inválido / inexistente). Configurable vía env.
 */

import { getApiBaseUrl } from '@/lib/config/api'

const DEFAULT_DUMMY_OBJECT_ID = '000000000000000000000000'

export async function verifyAdminBearerToken(token) {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return false
  }

  const dummyId =
    (process.env.REVALIDATE_AUTH_DUMMY_OBJECT_ID || DEFAULT_DUMMY_OBJECT_ID).trim()

  try {
    const base = getApiBaseUrl()
    const url = `${base}/photos/deletephoto/${dummyId}`

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    })

    if (res.status === 401 || res.status === 403) {
      return false
    }
    if (res.status >= 500) {
      return false
    }
    return true
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[verifyAdminBearerToken]', error.message)
    }
    return false
  }
}
