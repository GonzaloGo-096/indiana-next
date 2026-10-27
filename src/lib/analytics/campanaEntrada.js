/**
 * La campaña con la que entró a la sesión (anuncio o link con utm).
 *
 * El reenvío al aceptar las cookies abre la sesión con cookies: si para
 * entonces la persona ya navegó, la dirección no trae la campaña y la visita
 * quedaba como orgánica o directa (auditoría de analítica del 2026-10-26).
 *
 * Se guarda en sessionStorage (solo esta pestaña) y:
 * - vence a los 30 minutos, lo que dura una sesión de GA4: volver más tarde
 *   por otro camino no hereda una campaña vieja;
 * - se borra si la persona rechaza la medición.
 */

const CAMPANA = /^(utm_[a-z_]+|gclid|gbraid|wbraid)$/;
const CLAVE = "indiana_campana_entrada";
export const CAMPANA_VENCE_MS = 30 * 60 * 1000;

function campana(search) {
  return [...new URLSearchParams(search)].filter(([k]) => CAMPANA.test(k));
}

/** Si la dirección actual trae campaña, la recuerda (la última gana). */
export function rememberEntryCampaign() {
  try {
    const c = campana(window.location.search);
    if (!c.length) return;
    const valor = { q: new URLSearchParams(c).toString(), ts: Date.now() };
    window.sessionStorage.setItem(CLAVE, JSON.stringify(valor));
  } catch {
    // sessionStorage bloqueado: el reenvío sale sin la campaña, como antes.
  }
}

/** La dirección con la campaña de entrada, si no trae la suya y no venció. */
export function withEntryCampaign(href) {
  try {
    const u = new URL(href);
    if (campana(u.search).length) return href;
    const guardada = JSON.parse(window.sessionStorage.getItem(CLAVE) || "null");
    if (!guardada?.q || Date.now() - guardada.ts > CAMPANA_VENCE_MS) return href;
    for (const [k, v] of new URLSearchParams(guardada.q)) u.searchParams.set(k, v);
    return u.toString();
  } catch {
    // Sin poder leerla, se usa la dirección tal cual.
    return href;
  }
}

/** Al rechazar la medición no queda guardado el gclid de la persona. */
export function forgetEntryCampaign() {
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    // Bloqueado: no hay nada guardado que borrar.
  }
}
