/**
 * Configuración de autenticación para Next.js
 * 
 * Adaptado de indiana-usados para Next.js
 * 
 * @author Indiana Usados
 * @version 5.0.0 - Next.js compatible
 */

export const AUTH_CONFIG = {
  // Configuración de API (solo endpoints, baseURL y timeout vienen de variables de entorno)
  api: {
    endpoints: {
      login: '/user/loginuser'
    }
  },
  
  // Configuración de localStorage (mantenemos para compatibilidad)
  storage: {
    tokenKey: 'auth_token',
    userKey: 'auth_user'
  },
  
  // Rutas de la aplicación
  routes: {
    login: '/admin/login',
    dashboard: '/admin',
    home: '/'
  },

  // Configuración de headers para autorización
  headers: {
    authorization: 'Authorization',
    bearerPrefix: 'Bearer '
  }
}


