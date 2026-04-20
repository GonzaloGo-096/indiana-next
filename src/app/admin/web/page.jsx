'use client'

import { useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/admin/AdminLayout/AdminLayout'
import styles from '../dashboard.module.css'

export default function AdminWebPage() {
  const { logout } = useAuth()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className={styles.workSurface}>
        <section className={styles.sectionPlaceholder} aria-labelledby="admin-web-heading">
          <h2 id="admin-web-heading" className={styles.sectionPlaceholderTitle}>
            Web
          </h2>
          <p className={styles.sectionPlaceholderText}>
            Desde acá vas a poder administrar el contenido del sitio público. Por ahora el inventario y la
            publicación en caché siguen en la sección <strong>Usados</strong>.
          </p>
        </section>
      </div>
    </AdminLayout>
  )
}
