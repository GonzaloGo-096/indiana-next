/**
 * Código de referencia de cada clic en WhatsApp.
 *
 * Viaja en el mensaje que la persona manda ("(Ref. web K7Q2M)") y en el
 * evento whatsapp_click de GA4 (`lead_ref`). Cuando el vendedor anota la
 * referencia de un chat, se cruza con GA4 y se sabe de qué auto, qué botón y
 * qué campaña vino. Es al azar: no identifica a la persona.
 */

// Sin 0/O, 1/I/L: el vendedor lo copia a mano desde el chat.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LARGO = 5;

export function newLeadRef() {
  const out = [];
  const bytes = new Uint8Array(LARGO);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < LARGO; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (const b of bytes) out.push(ALFABETO[b % ALFABETO.length]);
  return out.join("");
}

/**
 * Agrega la referencia al texto prellenado de un link de WhatsApp
 * (wa.me/…?text= o api.whatsapp.com/send?…&text=). Si el link no es de
 * WhatsApp o no se puede leer, lo devuelve igual.
 */
export function withLeadRef(href, ref) {
  try {
    const url = new URL(href);
    if (!/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(url.hostname)) return href;
    const texto = url.searchParams.get("text") || "";
    const marca = `(Ref. web ${ref})`;
    const nuevo = texto ? `${texto}\n\n${marca}` : `Hola! ${marca}`;
    // A mano y con encodeURIComponent: URLSearchParams pone "+" en los
    // espacios y algunas versiones de WhatsApp los muestran tal cual.
    const resto = [...url.searchParams].filter(([k]) => k !== "text");
    const query = [...resto, ["text", nuevo]]
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return `${url.origin}${url.pathname}?${query}`;
  } catch {
    // Un href raro no puede romper el botón: se usa tal cual, sin referencia.
    return href;
  }
}
