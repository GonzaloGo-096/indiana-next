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

/**
 * Nombres de clave con forma de dato personal. Por pedazo y no exactos: antes
 * `user_email` o `nombreApellido` pasaban.
 */
const PII_KEY = /mail|phone|tel[eé]fono|celular|dni|password|nombre|apellido|mensaje|message|direcci|address|^cv$/i;

const debug =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true";

/**
 * Claves que arma track() o el cargador y que un componente no puede pisar.
 * `analytics_test` es la marca de prueba: con cualquier valor (incluso false)
 * GTM mandaría debug_mode y GA4 trataría la visita como prueba.
 */
const RESERVED_KEYS = new Set(["event", "location", "analytics_test"]);

function cleanParams(params) {
  const out = {};
  for (const [key, value] of Object.entries(params || {})) {
    if (RESERVED_KEYS.has(key)) {
      log.warn(`se descartó "${key}": la arma track(), no el componente`);
      continue;
    }
    if (PII_KEY.test(key)) {
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
 * Son todos los parámetros del contrato con GTM menos `location`, que va
 * siempre (el test de contrato lo compara con scripts/gtm-definition.mjs).
 */
export const RESET_KEYS = Object.freeze([
  "component_id",
  "item_id",
  "item_name",
  "item_category",
  "marca",
  "lead_ref",
  "form_id",
  "page_location",
  "page_title",
  "results_count",
  "filters_count",
]);

/** Nombres de parámetros de URL que pueden traer un dato personal. */
const PII_QUERY = /mail|phone|tel[eé]fono|celular|dni|nombre|apellido|direcci|address/i;

/**
 * La URL sin parámetros que parezcan datos personales: un link de campaña de
 * mail puede traer ?email=... y GA4 lo guardaría en page_location. El resto
 * (utm_*, gclid, filtros del listado) queda: GA4 lee de ahí la campaña.
 * @param {string} href
 */
export function urlSinDatosPersonales(href) {
  try {
    const u = new URL(href);
    // Pedazo por pedazo y sin volver a codificar: así el resto de la URL queda
    // tal cual llegó (searchParams reescribía %20 como + y las comas).
    const partes = u.search.slice(1).split("&").filter(Boolean);
    const quedan = partes.filter((p) => {
      let clave = p.split("=")[0];
      try {
        clave = decodeURIComponent(clave.replace(/\+/g, " "));
      } catch {
        // Clave mal codificada: se evalúa como vino.
      }
      return !PII_QUERY.test(clave);
    });
    if (quedan.length === partes.length) return u.toString();
    u.search = quedan.length ? `?${quedan.join("&")}` : "";
    return u.toString();
  } catch {
    // Una URL que no se puede leer no se manda.
    return undefined;
  }
}

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
