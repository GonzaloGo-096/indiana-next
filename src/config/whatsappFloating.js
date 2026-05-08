/**
 * Configuración del botón flotante de WhatsApp por ruta.
 * Los números van sin "+" (formato wa.me).
 * Si un área pasa a tener línea propia, cambiá solo el phone de ese canal.
 *
 * leadType y vertical alimentan los eventos whatsapp_click / generate_lead
 * para segmentación por vertical e intención en GA4 / GTM.
 * messageTemplateId es un slug kebab-case que identifica el canal en reportes.
 */

import { LEAD_TYPES, VERTICALS } from "../lib/analytics/events";

/**
 * @typedef {{
 *   phone: string;
 *   message: string;
 *   label: string;
 *   messageTemplateId: string;
 *   leadType: string;
 *   vertical?: string;
 * }} WhatsAppChannel
 */

/** @type {WhatsAppChannel} */
const USADOS = {
  phone: "543816295959",
  message: "Hola, estoy interesado en autos usados",
  label: "Usados",
  messageTemplateId: "usados",
  leadType: LEAD_TYPES.USED_VEHICLE_INQUIRY,
  vertical: VERTICALS.USADOS,
};

/** @type {WhatsAppChannel} */
const ZEROKM = {
  phone: "543816295959",
  message: "Hola, estoy interesado en vehículos 0KM",
  label: "0km",
  messageTemplateId: "zero-km",
  leadType: LEAD_TYPES.ZERO_KM_INQUIRY,
  vertical: VERTICALS.ZERO_KM,
};

/** @type {WhatsAppChannel} */
const POSTVENTA = {
  phone: "543816295959",
  message: "Hola, quiero información sobre servicios de postventa",
  label: "Postventa",
  messageTemplateId: "postventa",
  leadType: LEAD_TYPES.GENERAL_INQUIRY,
  vertical: VERTICALS.POSTVENTA,
};

/** @type {WhatsAppChannel} */
const PLANES = {
  phone: "543816295959",
  message: "Hola! Quiero consultar sobre los planes de financiación Peugeot",
  label: "Planes",
  messageTemplateId: "planes",
  leadType: LEAD_TYPES.PLAN_INQUIRY,
  vertical: VERTICALS.ZERO_KM,
};

/** @type {WhatsAppChannel} */
const GENERAL = {
  phone: "543816295959",
  message: "Hola, quiero información sobre Indiana Peugeot",
  label: "Indiana Peugeot",
  messageTemplateId: "general",
  leadType: LEAD_TYPES.GENERAL_INQUIRY,
  // vertical omitido: contacto cross-vertical
};

/**
 * @param {string} pathname
 * @returns {WhatsAppChannel | null} null = no mostrar botón
 */
export function resolveWhatsAppForPathname(pathname) {
  if (!pathname) return GENERAL;
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/trabaja-con-nosotros")) return null; // no es lead comercial
  if (pathname.startsWith("/usados")) return USADOS;
  if (pathname.startsWith("/0km")) return ZEROKM;
  if (pathname.startsWith("/postventa")) return POSTVENTA;
  if (pathname.startsWith("/planes")) return PLANES;
  return GENERAL;
}

/**
 * @param {WhatsAppChannel} channel
 * @returns {string}
 */
export function buildWhatsAppUrl(channel) {
  const text = encodeURIComponent(channel.message.trim());
  return `https://wa.me/${channel.phone}?text=${text}`;
}
