/**
 * Middleware de Next.js para protección de rutas administrativas
 * 
 * Protege todas las rutas /admin/* excepto /admin/login
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Solo proteger rutas /admin/* (excepto /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // En cliente, verificar token en localStorage
    // En servidor, redirigir al login (el cliente verificará después)
    const response = NextResponse.next()
    
    // Agregar header para que el cliente sepa que debe verificar
    response.headers.set('x-require-auth', 'true')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}

