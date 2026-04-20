'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/auth/RequireAuth'
import styles from '@/app/admin/dashboard.module.css'

const NAV_SECTIONS = [
  {
    href: '/admin',
    label: 'Inicio',
    match: (path) => path === '/admin' || path === '/admin/',
  },
  {
    href: '/admin/usados',
    label: 'Usados',
    match: (path) => path.startsWith('/admin/usados'),
  },
  {
    href: '/admin/web',
    label: 'Web',
    match: (path) => path.startsWith('/admin/web'),
  },
]

export default function AdminLayout({ children, onLogout }) {
  const pathname = usePathname() || ''
  const router = useRouter()

  return (
    <RequireAuth>
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.headerGlow} aria-hidden />
          <div className={styles.headerContent}>
            <div className={styles.headerBrand}>
              <span className={styles.headerBadge}>Admin</span>
              <div className={styles.headerBrandStack}>
                <span className={styles.headerEyebrow}>Indiana</span>
                <h1 className={styles.headerTitle}>Panel administrativo</h1>
              </div>
            </div>
            <nav className={styles.headerNav} aria-label="Secciones del panel">
              <div className={styles.headerNavTrack}>
                <ul className={styles.headerNavList}>
                  {NAV_SECTIONS.map((item) => {
                    const active = item.match(pathname)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`${styles.headerNavLink} ${active ? styles.headerNavLinkActive : ''}`}
                          aria-current={active ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>
            <div className={styles.headerUser}>
              <span className={styles.userLabel}>Sesión</span>
              <div className={styles.headerUserActions}>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className={styles.backButton}
                >
                  ← Volver al sitio
                </button>
                <button type="button" onClick={onLogout} className={styles.logoutButton}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </RequireAuth>
  )
}
