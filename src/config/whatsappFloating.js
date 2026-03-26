/**
 * Configuración del botón flotante de WhatsApp por ruta.
 * Los números van sin "+" (formato wa.me).
 * Si un área pasa a tener línea propia, cambiá solo el phone de ese canal.
 */

/** @typedef {{ phone: string; message: string; label: string }} WhatsAppChannel */

/** @type {WhatsAppChannel} */
const USADOS = {
  phone: "543816295959",
  message: "Hola, estoy interesado en autos usados",
  label: "Usados",
};

/** @type {WhatsAppChannel} */
const ZEROKM = {
  phone: "543816295959",
  message: "Hola, estoy interesado en vehículos 0KM",
  label: "0km",
};

/** @type {WhatsAppChannel} */
const POSTVENTA = {
  phone: "543816295959",
  message: "Hola, quiero información sobre servicios de postventa",
  label: "Postventa",
};

/** @type {WhatsAppChannel} */
const PLANES = {
  phone: "543816295959",
  message: "Hola! Quiero consultar sobre los planes de financiación Peugeot",
  label: "Planes",
};

/** @type {WhatsAppChannel} */
const CAREERS = {
  phone: "543816295959",
  message: "Hola, me interesa trabajar en Indiana Peugeot",
  label: "Trabaja con nosotros",
};

/** @type {WhatsAppChannel} */
const GENERAL = {
  phone: "543816295959",
  message: "Hola, quiero información sobre Indiana Peugeot",
  label: "Indiana Peugeot",
};

/**
 * @param {string} pathname
 * @returns {WhatsAppChannel | null} null = no mostrar botón
 */
export function resolveWhatsAppForPathname(pathname) {
  if (!pathname) return GENERAL;
  if (pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/usados")) return USADOS;
  if (pathname.startsWith("/0km")) return ZEROKM;
  if (pathname.startsWith("/postventa")) return POSTVENTA;
  if (pathname.startsWith("/planes")) return PLANES;
  if (pathname.startsWith("/trabaja-con-nosotros")) return CAREERS;
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
