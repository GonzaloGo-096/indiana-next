/**
 * Servicio de autenticación para Next.js
 * 
 * Adaptado de indiana-usados para Next.js
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Next.js compatible
 */

import { AUTH_CONFIG } from '@/config/auth'
import { authAxiosInstance } from '@/lib/api/axiosInstance'

/**
 * Obtener base URL del API (compatible con Next.js)
 */
const getBaseURL = () => {
  if (typeof process !== "undefined" && process.env) {
    return (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    );
  }
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    );
  }
  return "http://localhost:3001";
};

/**
 * Obtener timeout configurado
 */
const getTimeout = () => {
  const timeout = process.env.NEXT_PUBLIC_API_TIMEOUT || "15000";
  return parseInt(timeout, 10) || 15000;
};

/**
 * Función helper para limpiar localStorage (solo en cliente)
 */
const clearLocalStorage = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.storage.userKey);
  }
};

/**
 * Servicios de autenticación
 */
export const authService = {
  /**
   * Login - Autenticación con backend
   */
  login: async (credentials) => {
    const loginData = {
      username: credentials.username,
      password: credentials.password
    };

    try {
      const baseURL = getBaseURL();
      const timeout = getTimeout();

      // Log solo en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log("[Auth] Iniciando login", {
          endpoint: AUTH_CONFIG.api.endpoints.login,
          baseURL,
          username: credentials.username
        });
      }

      const response = await authAxiosInstance.post(
        AUTH_CONFIG.api.endpoints.login,
        loginData
      );

      if (response.data.error) {
        throw new Error(response.data.msg || "Error en el login");
      }

      return {
        success: true,
        data: {
          token: response.data.token,
          user: {
            username: credentials.username,
            role: "user"
          }
        }
      };
    } catch (error) {
      // Manejo de errores
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          message: `Timeout: El backend no respondió en ${getTimeout()}ms. Verifica que esté ejecutándose.`
        };
      }

      if (!error.response) {
        return {
          success: false,
          message: `Error de conexión: No se pudo conectar con ${getBaseURL()}. Verifica que el backend esté ejecutándose.`
        };
      }

      return {
        success: false,
        message: error.response?.data?.msg || error.message || "Error de conexión"
      };
    }
  },

  /**
   * Logout - Limpiar sesión
   */
  logout: async () => {
    clearLocalStorage();
  },

  /**
   * Verificar token (simplificado)
   */
  verifyToken: async () => {
    if (typeof window === "undefined") {
      return { valid: false };
    }

    const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey);
    
    if (!token) {
      return { valid: false };
    }

    return { valid: true };
  },

  /**
   * Función helper para limpiar localStorage (exportada)
   */
  clearLocalStorage
};


