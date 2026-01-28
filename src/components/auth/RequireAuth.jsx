/**
 * RequireAuth - Componente para proteger rutas que requieren autenticación
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Next.js compatible
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AUTH_CONFIG } from '@/config/auth'

export const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Solo verificar en cliente
    if (typeof window === 'undefined') return

    if (!isLoading && !isAuthenticated) {
      router.push(AUTH_CONFIG.routes.login)
    }
  }, [isAuthenticated, isLoading, router])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}
      >
        <div>Verificando autenticación...</div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (el useEffect redirigirá)
  if (!isAuthenticated) {
    return null
  }

  // Si está autenticado, mostrar el contenido
  return children
}



