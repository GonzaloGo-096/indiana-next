/**
 * RevalidateSection - Sección para publicar cambios y revalidar cache
 * 
 * ⚠️ NOTA DE SEGURIDAD:
 * Este componente usa un secret temporal via input manual porque el login actual
 * NO es validable en el servidor (solo client-side con localStorage).
 * 
 * SOLUCIÓN TEMPORAL: Para producción, debería migrarse a autenticación server-side
 * (cookies httpOnly, NextAuth, o middleware de auth) y eliminar el secret manual.
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Secret solo en server, input manual para desarrollo
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDirtyVehicleIds, clearDirtyVehicleIds } from '@/utils/dirtyVehicleIds'
import styles from './RevalidateSection.module.css'

export default function RevalidateSection() {
  const [dirtyIds, setDirtyIds] = useState([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  // ⚠️ TEMPORAL: Secret manual solo para desarrollo/local
  // En producción debe migrarse a auth server-side
  const [secret, setSecret] = useState('')

  // ✅ CARGAR IDs SUCIOS AL MONTAR Y CUANDO CAMBIAN
  const loadDirtyIds = useCallback(() => {
    const ids = getDirtyVehicleIds()
    setDirtyIds(ids)
  }, [])

  useEffect(() => {
    loadDirtyIds()
    
    // ✅ REFRESCAR CADA 2 SEGUNDOS PARA DETECTAR CAMBIOS
    const interval = setInterval(loadDirtyIds, 2000)
    return () => clearInterval(interval)
  }, [loadDirtyIds])

  // ✅ MANEJAR PUBLICACIÓN
  const handlePublish = useCallback(async () => {
    if (dirtyIds.length === 0) {
      setError('No hay cambios pendientes para publicar')
      return
    }

    // ⚠️ VALIDAR SECRET MANUAL (solo para desarrollo/local)
    if (!secret || secret.trim() === '') {
      setError('Debe ingresar el secret de revalidación')
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
          'x-revalidate-secret': secret.trim()
        },
        body: JSON.stringify({
          vehicleIds: dirtyIds,
          revalidateList: true,
          warmup: true
        })
      })

      const data = await response.json()

      // ✅ SOLO LIMPIAR IDs SUCIOS SI LA RESPUESTA ES OK
      if (response.ok && data.ok === true) {
        // ✅ LIMPIAR IDs SUCIOS SOLO EN ÉXITO
        clearDirtyVehicleIds()
        loadDirtyIds()
        setResult(data)
      } else {
        // ❌ NO LIMPIAR SI HAY ERROR (401, 500, etc.)
        throw new Error(data.error || 'Error al publicar cambios')
      }
    } catch (err) {
      // ❌ NO LIMPIAR dirtyVehicleIds EN ERROR
      setError(err.message || 'Error al publicar cambios')
      if (process.env.NODE_ENV === 'development') {
        console.error('[RevalidateSection] Error:', err)
      }
    } finally {
      setIsPublishing(false)
    }
  }, [dirtyIds, secret, loadDirtyIds])

  const pendingCount = dirtyIds.length

  return (
    <div className={styles.revalidateSection}>
      <h3 className={styles.title}>Publicación / Cache</h3>
      
      <div className={styles.content}>
        <div className={styles.info}>
          <p className={styles.pendingCount}>
            {pendingCount > 0 ? (
              <span className={styles.hasPending}>
                {pendingCount} cambio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
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
        </div>

        <button
          onClick={handlePublish}
          disabled={isPublishing || pendingCount === 0 || !secret.trim()}
          className={styles.publishButton}
        >
          {isPublishing ? 'Publicando...' : 'Publicar Cambios'}
        </button>
      </div>

      {/* ⚠️ INPUT TEMPORAL: Secret manual solo para desarrollo/local */}
      {/* En producción debe migrarse a auth server-side */}
      <div className={styles.secretInput}>
        <label htmlFor="revalidate-secret" className={styles.secretLabel}>
          Secret de Revalidación (solo local):
        </label>
        <input
          id="revalidate-secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Ingresar REVALIDATE_SECRET de .env.local"
          className={styles.secretInputField}
        />
        <small className={styles.secretHint}>
          ⚠️ TEMPORAL: En producción usar auth server-side. Ver .env.local para el valor.
        </small>
      </div>

      {/* ✅ RESULTADO */}
      {result && (
        <div className={styles.result}>
          <h4>✅ Publicación exitosa</h4>
          <pre className={styles.resultJson}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* ✅ ERROR */}
      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}

