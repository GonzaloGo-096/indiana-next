/**
 * Núcleo del tracking: empuja eventos al window.dataLayer con guards y sanitización.
 *
 * Garantías:
 * - SSR-safe (no toca window en server).
 * - Idempotente (compatible con GTM cargando antes/después).
 * - Nunca lanza: si algo falla, el tracking queda silencioso. La UI no se rompe.
 * - Sanitiza valores y BLOQUEA keys con apariencia de PII como segunda línea de defensa.
 *
 * La primera línea de defensa es no agregar la key de PII en quien dispara el evento.
 */

import { REQUIRED_CONTEXT_EVENTS } from "./events";

const MAX_STRING_LEN = 500;

const PII_KEY_BLOCKLIST = new Set([
  "email",
  "mail",
  "e_mail",
  "telefono",
  "phone",
  "celular",
  "dni",
  "password",
  "pass",
  "nombre",
  "apellido",
  "fullname",
  "first_name",
  "last_name",
  "mensaje",
  "message",
  "cv",
  "curriculum",
  "address",
  "direccion",
]);

const REQUIRED_CONTEXT_KEYS = ["source", "location", "component_id"];

const isDev = process.env.NODE_ENV !== "production";
const debugInProd = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

function isPiiKey(key) {
  return PII_KEY_BLOCKLIST.has(String(key).toLowerCase());
}

function coerceValue(value) {
  if (value === null) return null;
  if (value === undefined) return null;
  const t = typeof value;
  if (t === "string") {
    return value.length > MAX_STRING_LEN ? value.slice(0, MAX_STRING_LEN) : value;
  }
  if (t === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (t === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map(coerceValue).filter((v) => v !== undefined);
  }
  if (t === "object") {
    return sanitizeParams(value);
  }
  return null;
}

function sanitizeParams(params) {
  if (!params || typeof params !== "object") return {};
  const out = {};
  for (const key of Object.keys(params)) {
    if (isPiiKey(key)) {
      if (isDev) {
        console.warn(
          `[analytics] dropped param "${key}" (PII blocklist). No mandes datos personales al dataLayer.`,
        );
      }
      continue;
    }
    const value = coerceValue(params[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function warnMissingContext(event, params) {
  if (!isDev) return;
  if (!REQUIRED_CONTEXT_EVENTS.has(event)) return;
  const missing = REQUIRED_CONTEXT_KEYS.filter((k) => !params[k]);
  if (missing.length > 0) {
    console.warn(
      `[analytics] event "${event}" missing required context keys: ${missing.join(", ")}. Usa <TrackedLink>/<TrackedButton>/<WhatsAppLink> o pasá los props.`,
    );
  }
}

/**
 * Empuja un evento al dataLayer.
 * @param {string} event - nombre del evento (usar EVENTS.* desde events.js)
 * @param {Record<string, unknown>} [params] - parámetros del evento
 */
export function pushDataLayer(event, params = {}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof event !== "string" || event.length === 0) return;
    const safe = sanitizeParams(params);
    warnMissingContext(event, safe);
    window.dataLayer = window.dataLayer || [];
    const payload = { event, ...safe };
    window.dataLayer.push(payload);
    if (isDev || debugInProd) {
      console.debug(
        `[analytics] ${new Date().toISOString()} ${payload.event}`,
        payload,
      );
    }
  } catch {
    // Tracking nunca rompe la UI.
  }
}

/**
 * Para uso interno (consent.js): empuja un comando de gtag al dataLayer.
 * gtag('consent', 'default'|'update', {...}) → dataLayer.push(arguments)
 */
export function pushGtagCommand(...args) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    // gtag empuja el `arguments` literal (array-like) al dataLayer
    window.dataLayer.push(args);
  } catch {
    /* noop */
  }
}
