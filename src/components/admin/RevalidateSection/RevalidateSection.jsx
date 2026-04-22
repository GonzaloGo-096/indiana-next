/**
 * RevalidateSection - Publicar cambios y revalidar caché de Next.js
 *
 * El panel envía el JWT del admin (misma sesión que crear/editar autos).
 * El servidor valida el token contra el backend; no hace falta pegar REVALIDATE_SECRET en el navegador.
 *
 * Para cron/CLI: POST con header x-revalidate-secret (solo servidor).
 *
 * UI: acceso secundario al final de la página; el detalle se muestra en un modal.
 *
 * @author Indiana Usados
 * @version 3.1.0 - Trigger + modal
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [modalOpen, setModalOpen] = useState(false)
  const triggerRef = useRef(null)
  const closeButtonRef = useRef(null)

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

  useEffect(() => {
    if (!modalOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setModalOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [modalOpen])

  useEffect(() => {
    if (!modalOpen) return
    const id = requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [modalOpen])

  const wasModalOpenRef = useRef(false)
  useEffect(() => {
    if (wasModalOpenRef.current && !modalOpen) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus()
      })
    }
    wasModalOpenRef.current = modalOpen
  }, [modalOpen])

  const handlePublish = useCallback(async () => {
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
  /** Vacío en localStorage no significa que la CDN esté al día (otro navegador, datos borrados, etc.). */
  const canPublish = hasToken && !isPublishing

  const openModal = useCallback(() => {
    setError(null)
    setResult(null)
    loadDirtyIds()
    syncAuthToken()
    setModalOpen(true)
  }, [loadDirtyIds, syncAuthToken])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const modalContent = modalOpen ? (
    <div
      className={styles.modalOverlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="revalidate-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="revalidate-dialog-title" className={styles.modalTitle}>
            Publicación / caché
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.modalClose}
            onClick={closeModal}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.info}>
            <p className={styles.pendingCount}>
              {pendingCount > 0 ? (
                <span className={styles.hasPending}>
                  {pendingCount} actualización{pendingCount !== 1 ? 'es' : ''} de caché pendiente
                  {pendingCount !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className={styles.noPending}>
                  No hay IDs marcados en este navegador; igual podés <strong>forzar</strong> refresco del
                  catálogo y fichas en el servidor (útil si el público no coincide con el panel).
                </span>
              )}
            </p>

            <p className={styles.explainPending}>
              Incluye <strong>altas, ediciones y bajas</strong>: el backend ya guardó el cambio, pero las
              páginas públicas pueden seguir mostrando datos viejos hasta que publiqués acá. Los pendientes
              se guardan en <strong>este equipo/navegador</strong>; en otro no se ven, pero el botón sigue
              sirviendo para invalidar caché. Al <strong>eliminar</strong> un auto también conviene publicar.
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
            {isPublishing
              ? 'Publicando...'
              : pendingCount > 0
                ? 'Actualizar caché del sitio'
                : 'Forzar actualización (listado + fichas)'}
          </button>

          <p className={styles.whatButtonDoes}>
            <strong>Qué hace el botón:</strong> invalida en el servidor la caché del listado de usados y de
            todas las fichas; si hay IDs arriba, también las etiquetas por vehículo. Luego intenta precargar
            URLs (un auto borrado puede dar 404 en el warmup: la caché igual se descarta). Si venías con
            pendientes, al terminar bien esa lista se vacía.
          </p>

          <p className={styles.prodNote}>
            Autenticación: misma sesión del panel (Bearer). El secret{' '}
            <code className={styles.codeInline}>REVALIDATE_SECRET</code> queda solo en el servidor para cron o scripts.
          </p>

          {result && (
            <div className={styles.result}>
              <h4>Publicación exitosa</h4>
              <pre className={styles.resultJson}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className={styles.footerWrap}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.openTrigger}
        onClick={openModal}
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
      >
        <span className={styles.openTriggerLabel}>Publicación y caché</span>
        {pendingCount > 0 ? (
          <span className={styles.pendingBadge} aria-label={`${pendingCount} pendientes`}>
            {pendingCount}
          </span>
        ) : null}
      </button>

      {typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null}
    </div>
  )
}
