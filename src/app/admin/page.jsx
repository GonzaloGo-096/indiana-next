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
        <div className={styles.pageHero}>
          <span className={styles.pageHeroEyebrow}>Resumen</span>
          <h2 className={styles.adminHomeTitle}>Inicio</h2>
        </div>
        <ul className={styles.adminHomeGrid}>
          <li>
            <Link href="/admin/usados" className={styles.adminHomeCard}>
              <span className={styles.adminHomeCardKicker}>Catálogo</span>
              <span className={styles.adminHomeCardTitle}>Usados</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/web" className={styles.adminHomeCard}>
              <span className={styles.adminHomeCardKicker}>Sitio</span>
              <span className={styles.adminHomeCardTitle}>Web</span>
            </Link>
          </li>
        </ul>
      </div>
    </AdminLayout>
  )
}
