/**
 * Login - Página de inicio de sesión para administradores
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_CONFIG } from '@/config/auth'
import LoginForm from '@/components/auth/LoginForm/LoginForm'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Si ya está autenticado, redirigir
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push(AUTH_CONFIG.routes.dashboard)
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (values) => {
    clearError()
    setIsSubmitting(true)

    try {
      const result = await login(values)

      if (result.success) {
        // Login exitoso - redirigir al dashboard
        router.push(AUTH_CONFIG.routes.dashboard)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Login] Error durante login', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Si está cargando, mostrar loading
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '18px',
                  color: '#666'
                }}
              >
                Verificando sesión...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <h2 className={styles.title}>Iniciar Sesión</h2>

            {/* Credenciales solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className={styles.credentials}>
                <p>
                  <strong>Desarrollo:</strong> Usuario: indiana-autos | Contraseña: 12345678
                </p>
              </div>
            )}

            {/* Mostrar error general */}
            {error && <div className={styles.error}>{error}</div>}

            <LoginForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errors={{}}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

