/**
 * Panel admin — Inicio: acceso a las secciones Usados y Web.
 */

'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/admin/AdminLayout/AdminLayout'
import styles from './dashboard.module.css'

export default function AdminHomePage() {
  const { logout } = useAuth()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className={styles.adminHome}>
        <h2 className={styles.adminHomeTitle}>Inicio</h2>
        <p className={styles.adminHomeLead}>
          Elegí el área en la que querés trabajar. Podés cambiar en cualquier momento desde el menú superior.
        </p>
        <ul className={styles.adminHomeGrid}>
          <li>
            <Link href="/admin/usados" className={styles.adminHomeCard}>
              <span className={styles.adminHomeCardKicker}>Catálogo</span>
              <span className={styles.adminHomeCardTitle}>Usados</span>
              <span className={styles.adminHomeCardDesc}>
                Inventario, filtros, altas, ediciones y publicación en caché.
              </span>
            </Link>
          </li>
          <li>
            <Link href="/admin/web" className={styles.adminHomeCard}>
              <span className={styles.adminHomeCardKicker}>Sitio</span>
              <span className={styles.adminHomeCardTitle}>Web</span>
              <span className={styles.adminHomeCardDesc}>
                Contenido y herramientas del sitio público.
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </AdminLayout>
  )
}
