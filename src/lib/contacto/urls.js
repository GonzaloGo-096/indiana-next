/**
 * Construye las URLs de contacto a partir de los datos de `config/contacto`.
 *
 * Existe para que el dato viaje como dato y se vuelva URL una sola vez, al
 * final. Antes la configuración armaba el href y sesenta líneas más allá el
 * componente lo desarmaba con expresiones regulares para recuperar el número
 * que ya tenía entero antes de esconderlo en un string.
 */

/**
 * Enlace a WhatsApp con el mensaje precargado.
 *
 * Se usa api.whatsapp.com y no wa.me a propósito: da mejor resultado con los
 * mensajes precargados. Aun así WhatsApp Web puede no completarlo solo —es una
 * restricción suya contra el spam— y la persona tiene que apretar enviar.
 *
 * @param {{phone: string, mensaje?: string}} whatsapp
 * @returns {string}
 */
export function urlWhatsApp({ phone, mensaje }) {
  const base = `https://api.whatsapp.com/send?phone=${phone}`;
  const texto = typeof mensaje === "string" ? mensaje.trim() : "";
  return texto ? `${base}&text=${encodeURIComponent(texto)}` : base;
}

/**
 * @param {string} usuario Sin arroba.
 * @returns {string}
 */
export function urlInstagram(usuario) {
  return `https://instagram.com/${usuario}`;
}

/**
 * @param {string} direccion Tal como se busca en el mapa.
 * @returns {string}
 */
export function urlMapa(direccion) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(direccion)}`;
}
