/**
 * useAuth - Hook consolidado para autenticación completa (Next.js)
 * 
 * Adaptado de indiana-usados para Next.js
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Next.js compatible
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AUTH_CONFIG } from '@/config/auth'
import { authService } from '@/lib/services/authService'

export const useAuth = () => {
  const router = useRouter()
  
  // Estados de autenticación
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Validar si un token JWT está expirado (solo lectura de payload)
   * 
   * ⚠️ IMPORTANTE: Esta validación es SOLO para UX, NO para seguridad.
   * La SEGURIDAD REAL está en el backend, que valida firma en cada request.
   */
  const isTokenExpired = useCallback((token) => {
    if (!token) return true
    
    try {
      // Decodificar payload (base64) - NO valida firma, solo lee datos
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      
      // Verificar expiración
      if (payload.exp && payload.exp < currentTime) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Auth] Token expirado detectado', {
            exp: payload.exp,
            currentTime,
            expired: true
          })
        }
        return true
      }
      
      return false
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] Error decodificando token', error)
      }
      return true // Si no se puede decodificar, considerarlo expirado
    }
  }, [])

  /**
   * Verificar autenticación con validación de token
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // Solo en cliente
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
      const userData = localStorage.getItem(AUTH_CONFIG.storage.userKey)

      if (token && userData) {
        // Validar expiración del token
        if (isTokenExpired(token)) {
          if (process.env.NODE_ENV === 'development') {
            console.info('[Auth] Token expirado, limpiando sesión')
          }
          await logout()
          return
        }

        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsAuthenticated(true)
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[Auth] Error parsing user data', error)
          }
          await logout()
        }
      } else {
        // No está autenticado
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] Error checking auth status', error)
      }
      await logout()
    } finally {
      setIsLoading(false)
    }
  }, [isTokenExpired])

  /**
   * Logout con limpieza completa
   */
  const logout = useCallback(async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.info('[Auth] Iniciando logout')
      }
      
      // Limpiar localStorage
      authService.clearLocalStorage()
      
      // Limpiar estado
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
      
      // Redirigir al login
      router.push(AUTH_CONFIG.routes.login)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] Error durante logout', error)
      }
      // Continuar con la limpieza local aunque falle
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
    }
  }, [router])

  /**
   * Login con mejor manejo de errores
   */
  const login = useCallback(async (credentials) => {
    try {
      setError(null)
      setIsLoading(true)

      if (process.env.NODE_ENV === 'development') {
        console.debug('[Auth] Iniciando proceso de login', {
          username: credentials.username
        })
      }

      const response = await authService.login(credentials)
      
      if (response.success) {
        const { token, user: userData } = response.data
        
        // Validar token antes de guardarlo
        if (isTokenExpired(token)) {
          throw new Error('Token recibido está expirado')
        }
        
        // Guardar en localStorage (solo en cliente)
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_CONFIG.storage.tokenKey, token)
          localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(userData))
        }
        
        // Actualizar estado
        setUser(userData)
        setIsAuthenticated(true)
        
        if (process.env.NODE_ENV === 'development') {
          console.info('[Auth] Login exitoso', {
            username: userData.username
          })
        }
        
        return { success: true, data: userData }
      } else {
        const errorMessage = response.message || 'Error de autenticación'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = error.message || 'Error de conexión con el servidor'
      setError(errorMessage)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] Error durante login', errorMessage)
      }
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [isTokenExpired])

  /**
   * Verificar autenticación al cargar
   */
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  /**
   * Verificar token periódicamente (cada 5 minutos)
   */
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return

    const interval = setInterval(() => {
      const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
      if (token && isTokenExpired(token)) {
        if (process.env.NODE_ENV === 'development') {
          console.info('[Auth] Token expirado detectado, cerrando sesión')
        }
        logout()
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [isAuthenticated, isTokenExpired, logout])

  /**
   * Escuchar evento de unauthorized (desde interceptor de axios)
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleUnauthorized = () => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Evento unauthorized recibido')
      }
      logout()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  // Funciones utilitarias
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
    return token && !isTokenExpired(token) ? token : null
  }, [isTokenExpired])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getToken,
    clearError
  }
}



