/**
 * Configuración de autenticación para Next.js
 * 
 * Adaptado de indiana-usados para Next.js
 * 
 * @author Indiana Usados
 * @version 5.0.0 - Next.js compatible
 */

export const AUTH_CONFIG = {
  // Rutas de NUESTRO servidor, no del backend.
  //
  // El panel ya no le habla directo al backend: pasa por /api/admin, que
  // reenvía desde el servidor. La ruta real del backend vive en
  // src/app/api/admin/login/route.js, que es el único lugar que la conoce.
  api: {
    endpoints: {
      login: '/login'
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



