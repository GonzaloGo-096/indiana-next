/**
 * Helper para obtener SITE_URL (server-only)
 * Fuente única de verdad para URLs del sitio
 * 
 * ✅ HARDENING PROFESIONAL:
 * - Development: permite fallback a localhost
 * - Production: NO permite fallback - lanza error explícito si falta URL
 * 
 * Prioridad:
 * 1. NEXT_PUBLIC_SITE_URL (configurado en .env.local o producción)
 * 2. SITE_URL (sin NEXT_PUBLIC_, solo server-side)
 * 3. Fallback SOLO en development: localhost
 * 
 * @returns {string} URL base del sitio sin slash final (ej: "https://peugeotindiana.com.ar")
 * @throws {Error} En producción si falta NEXT_PUBLIC_SITE_URL o SITE_URL
 */
export function getSiteUrl() {
  // Verificar si estamos en server-side
  if (typeof process === "undefined") {
    throw new Error(
      "[getSiteUrl] ❌ Esta función solo puede ejecutarse en server-side (process no disponible)"
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Prioridad 1: NEXT_PUBLIC_SITE_URL (preferido)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL.trim();
    if (url) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
  }

  // Prioridad 2: SITE_URL (fallback server-side)
  if (process.env.SITE_URL) {
    const url = process.env.SITE_URL.trim();
    if (url) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
  }

  // En producción: NO permitir fallback - lanzar error explícito
  if (isProduction) {
    throw new Error(
      "[getSiteUrl] ❌ PRODUCTION ERROR: NEXT_PUBLIC_SITE_URL o SITE_URL deben estar configurados.\n" +
      "   Configure una de estas variables de entorno:\n" +
      "   - NEXT_PUBLIC_SITE_URL=https://peugeotindiana.com.ar (recomendado)\n" +
      "   - SITE_URL=https://peugeotindiana.com.ar (solo server-side)\n" +
      "   Sin esta configuración, las URLs SEO serán incorrectas en producción."
    );
  }

  // Solo en development: permitir fallback a localhost
  return "http://localhost:3000";
}

/**
 * Construir URL absoluta desde un path relativo
 * 
 * @param {string} path - Path relativo (ej: "/0km/208" o "0km/208")
 * @returns {string} URL absoluta (ej: "https://peugeotindiana.com.ar/0km/208")
 */
export function absoluteUrl(path) {
  const baseUrl = getSiteUrl();
  // Normalizar path: asegurar que empiece con /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

