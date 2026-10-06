/**
 * Único punto por donde el sitio le habla a GTM.
 *
 * - Agrega `location` (la sección del sitio) sacándola de la URL, para que
 *   ningún componente tenga que pasarla y no se desincronice.
 * - Descarta claves con forma de dato personal: segunda línea de defensa,
 *   la primera es no mandarlas.
 * - Nunca lanza: si el tracking falla, la página sigue andando.
 */

import { createLogger } from "@/lib/logger";
import { locationFromPathname } from "./locationFromPath";

const log = createLogger("analytics");

const MAX_STRING_LEN = 500;

const PII_KEYS = new Set([
  "email",
  "mail",
  "telefono",
  "phone",
  "celular",
  "dni",
  "password",
  "nombre",
  "apellido",
  "mensaje",
  "message",
  "cv",
  "direccion",
  "address",
]);

const debug =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

function cleanParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (PII_KEYS.has(key.toLowerCase())) {
      log.warn(`se descartó "${key}": parece un dato personal`);
      continue;
    }
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "string") out[key] = value.slice(0, MAX_STRING_LEN);
    else if (typeof value === "number") {
      if (Number.isFinite(value)) out[key] = value;
    } else if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

/**
 * GTM recuerda cada clave empujada y la reusa en los eventos siguientes: el
 * WhatsApp flotante de una ficha salía con el auto del view_item anterior
 * (medido el 2026-10-06). Estas claves se vacían en cada evento que no las trae.
 */
const RESET_KEYS = ["component_id", "item_id", "item_name", "item_category", "marca", "lead_ref"];

/**
 * @param {string} event - uno de EVENTS (events.js)
 * @param {Record<string, string | number | boolean | null | undefined>} [params]
 */
export function track(event, params = {}) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      event,
      ...Object.fromEntries(RESET_KEYS.map((k) => [k, undefined])),
      location: locationFromPathname(window.location.pathname),
      ...cleanParams(params),
    };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    // console.debug y no el logger: el logger se prende con API_DEBUG, que no
    // existe en el navegador.
    if (debug) console.debug("[analytics]", payload);
  } catch (err) {
    // Se registra y se sigue: un error de medición no puede romper un clic.
    log.warn(`no se pudo registrar "${event}":`, err?.message);
  }
}

/**
 * Comando de gtag (lo usa consent.js).
 * Tiene que empujar el objeto `arguments` literal: GTM ignora en silencio
 * los comandos empujados como Array, y el consentimiento no se aplicaba
 * hasta recargar la página (bug ya corregido en d4cf0a5).
 */
export function pushGtagCommand(...args) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag(...args);
  } catch (err) {
    log.warn("no se pudo aplicar el comando de gtag:", err?.message);
  }
}
