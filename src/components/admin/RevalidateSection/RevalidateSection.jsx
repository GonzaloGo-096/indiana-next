/**
 * RevalidateSection - Publicar cambios y revalidar caché de Next.js
 *
 * El panel envía el JWT del admin (misma sesión que crear/editar autos).
 * El servidor valida el token contra el backend; no hace falta pegar REVALIDATE_SECRET en el navegador.
 *
 * Para cron/CLI: POST con header x-revalidate-secret (solo servidor).
 *
 * @author Indiana Usados
 * @version 3.0.0 - Producción: Bearer admin, secret para automatización
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { AUTH_CONFIG } from '@/config/auth'
import { getDirtyVehicleIds, clearDirtyVehicleIds } from '@/utils/dirtyVehicleIds'
import styles from './RevalidateSection.module.css'

function readAuthToken() {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(AUTH_CONFIG.storage.tokenKey) || ''
  } catch {
    return ''
  }
}

export default function RevalidateSection() {
  const [dirtyIds, setDirtyIds] = useState([])
  const [authToken, setAuthToken] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const loadDirtyIds = useCallback(() => {
    const ids = getDirtyVehicleIds()
    setDirtyIds(ids)
  }, [])

  const syncAuthToken = useCallback(() => {
    setAuthToken(readAuthToken())
  }, [])

  useEffect(() => {
    loadDirtyIds()
    syncAuthToken()

    const interval = setInterval(() => {
      loadDirtyIds()
      syncAuthToken()
    }, 2000)
    return () => clearInterval(interval)
  }, [loadDirtyIds, syncAuthToken])

  const handlePublish = useCallback(async () => {
    if (dirtyIds.length === 0) {
      setError('No hay cambios pendientes para publicar')
      return
    }

    const token = readAuthToken().trim()
    if (!token) {
      setError('No hay sesión de administrador. Iniciá sesión de nuevo.')
      return
    }

    setIsPublishing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleIds: dirtyIds,
          revalidateList: true,
          warmup: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.ok === true) {
        clearDirtyVehicleIds()
        loadDirtyIds()
        setResult(data)
      } else {
        throw new Error(data.error || 'Error al publicar cambios')
      }
    } catch (err) {
      setError(err.message || 'Error al publicar cambios')
      if (process.env.NODE_ENV === 'development') {
        console.error('[RevalidateSection] Error:', err)
      }
    } finally {
      setIsPublishing(false)
    }
  }, [dirtyIds, loadDirtyIds])

  const pendingCount = dirtyIds.length
  const hasToken = authToken.trim().length > 0
  const canPublish = pendingCount > 0 && hasToken && !isPublishing

  return (
    <div className={styles.revalidateSection}>
      <h3 className={styles.title}>Publicación / Cache</h3>

      <div className={styles.content}>
        <div className={styles.info}>
          <p className={styles.pendingCount}>
            {pendingCount > 0 ? (
              <span className={styles.hasPending}>
                {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente
                {pendingCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className={styles.noPending}>Sin cambios pendientes</span>
            )}
          </p>

          {pendingCount > 0 && dirtyIds.length <= 10 && (
            <div className={styles.idList}>
              <small>IDs: {dirtyIds.join(', ')}</small>
            </div>
          )}

          {!hasToken && (
            <p className={styles.sessionHint}>
              Iniciá sesión como administrador para habilitar la publicación.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          className={styles.publishButton}
        >
          {isPublishing ? 'Publicando...' : 'Publicar Cambios'}
        </button>
      </div>

      <p className={styles.prodNote}>
        Usa tu sesión del panel (mismo login que para editar vehículos). El secret
        de revalidación queda solo en el servidor para cron o scripts; no hace falta
        pegarlo aquí.
      </p>

      {result && (
        <div className={styles.result}>
          <h4>Publicación exitosa</h4>
          <pre className={styles.resultJson}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
