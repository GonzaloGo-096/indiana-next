/**
 * Helper para obtener SITE_URL (server-only)
 * Fuente única de verdad para URLs del sitio
 * 
 * ✅ HARDENING PROFESIONAL:
 * - Development: permite fallback a localhost
 * - Preview: usa VERCEL_URL automáticamente si no hay configuración
 * - Production: NO permite fallback - lanza error explícito si falta URL
 * 
 * Prioridad:
 * 1. NEXT_PUBLIC_SITE_URL (configurado en .env.local o producción)
 * 2. SITE_URL (sin NEXT_PUBLIC_, solo server-side)
 * 3. Preview: VERCEL_URL (automático de Vercel)
 * 4. Development: localhost (fallback)
 * 
 * @returns {string} URL base del sitio sin slash final (ej: "https://peugeotindiana.com.ar")
 * @throws {Error} En producción si falta NEXT_PUBLIC_SITE_URL o SITE_URL
 */

/**
 * Detecta el entorno actual (development | preview | production)
 * @returns {'development' | 'preview' | 'production'}
 */
function getEnvironment() {
  if (typeof process === "undefined" || !process.env) {
    return 'development';
  }

  // Prioridad 1: VERCEL_ENV (en Vercel, es la fuente de verdad)
  if (process.env.VERCEL_ENV) {
    const env = process.env.VERCEL_ENV.toLowerCase().trim();
    if (env === 'preview' || env === 'production' || env === 'development') {
      return env;
    }
  }

  // Prioridad 2: NODE_ENV (fallback para entornos no-Vercel)
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  return 'development';
}

export function getSiteUrl() {
  // Verificar si estamos en server-side
  if (typeof process === "undefined") {
    throw new Error(
      "[getSiteUrl] ❌ Esta función solo puede ejecutarse en server-side (process no disponible)"
    );
  }

  const environment = getEnvironment();
  const isProduction = environment === 'production';
  const isPreview = environment === 'preview';

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

  // Prioridad 3: Preview - usar VERCEL_URL automáticamente
  if (isPreview && process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.trim();
    if (vercelUrl) {
      // VERCEL_URL ya incluye el dominio completo, solo agregar https://
      return `https://${vercelUrl}`;
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
  // Intentar detectar el puerto desde PORT o usar 3000 por defecto
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || "3000";
  return `http://localhost:${port}`;
}

/**
 * Helpers de entorno (reutilizables)
 */
export function isPreview() {
  return getEnvironment() === 'preview';
}

export function isProduction() {
  return getEnvironment() === 'production';
}

export function isDevelopment() {
  return getEnvironment() === 'development';
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

