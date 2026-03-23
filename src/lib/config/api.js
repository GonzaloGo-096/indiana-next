/**
 * api.js - Configuración centralizada del API backend
 *
 * Estrategia por entorno:
 * - development: fallback a localhost:3001 si no hay config
 * - preview: NO fallback; error si falta NEXT_PUBLIC_API_URL/API_URL
 * - production: NO fallback; error si falta NEXT_PUBLIC_API_URL/API_URL
 *
 * Variables: API_URL (server), NEXT_PUBLIC_API_URL (client+server)
 *
 * @author Indiana Peugeot
 * @version 1.1.0 - Fase 6: estrategia entornos
 */

const DEFAULT_API_URL_DEV = "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Detecta entorno: development | preview | production
 * Usa VERCEL_ENV en Vercel; NODE_ENV como fallback
 */
function getApiEnvironment() {
  if (typeof process === "undefined" || !process.env) {
    return "development";
  }
  if (process.env.VERCEL_ENV) {
    const env = process.env.VERCEL_ENV.toLowerCase().trim();
    if (env === "preview" || env === "production" || env === "development") {
      return env;
    }
  }
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  return "development";
}

/**
 * Obtener URL base del API backend
 *
 * development: API_URL || NEXT_PUBLIC_API_URL || localhost:3001
 * preview/production: API_URL || NEXT_PUBLIC_API_URL || throw Error
 *
 * @returns {string} URL base sin trailing slash
 * @throws {Error} En preview/production si falta configuración
 */
export function getApiBaseUrl() {
  const rawUrl =
    typeof process !== "undefined" && process.env
      ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ""
      : "";
  const url = (rawUrl || "").trim();

  if (url) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  const environment = getApiEnvironment();

  if (environment === "development") {
    return DEFAULT_API_URL_DEV;
  }

  // preview o production: no permitir fallback a localhost
  throw new Error(
    `[getApiBaseUrl] API_URL o NEXT_PUBLIC_API_URL obligatorios en ${environment}. ` +
      `Configure en Vercel/entorno: NEXT_PUBLIC_API_URL=https://back-indiana.vercel.app`
  );
}

/**
 * Obtener timeout de requests en milisegundos
 * API_TIMEOUT es server-only; NEXT_PUBLIC_API_TIMEOUT en client
 *
 * @returns {number} Timeout en ms
 */
export function getApiTimeout() {
  const raw =
    process.env.API_TIMEOUT ||
    process.env.NEXT_PUBLIC_API_TIMEOUT ||
    String(DEFAULT_TIMEOUT_MS);
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}
