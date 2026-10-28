/**
 * El auto (o plan) de la ficha que se está viendo.
 *
 * Lo anota ItemViewTracker al abrir la ficha y lo lee el WhatsApp flotante
 * al hacer clic: el flotante vive en el layout y no sabe en qué ficha está,
 * y es el 70% de los contactos. Se guarda con su ruta para que, al salir de
 * la ficha, el flotante deje de mandar ese auto.
 *
 * PageViewTracker también lo escucha: en una ficha, la visita se cuenta
 * recién cuando la ficha real se armó (ver onPageItem).
 */

let actual = null;
const oyentes = new Set();

export function setPageItem(item) {
  if (typeof window === "undefined" || !item?.item_id) return;
  actual = { ruta: window.location.pathname, item };
  for (const fn of oyentes) fn(actual.ruta);
}

export function getPageItem() {
  if (typeof window === "undefined" || !actual) return null;
  return actual.ruta === window.location.pathname ? actual.item : null;
}

/**
 * Avisa cada vez que una ficha anota su auto, con la ruta en la que lo hizo.
 * @param {(ruta: string) => void} fn
 * @returns {() => void} para dejar de escuchar
 */
export function onPageItem(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

/** Si la ruta ya tiene su auto anotado (la ficha se armó antes que el aviso). */
export function hasPageItemFor(ruta) {
  return actual?.ruta === ruta;
}

/**
 * Olvida el auto si es de otra ruta. Lo llama PageViewTracker al cambiar de
 * página: sin esto, al volver a una ficha ya vista (A → inicio → A) se tomaba
 * el auto viejo como "la ficha ya se armó" antes de que se armara de verdad.
 */
export function forgetPageItemUnless(ruta) {
  if (actual && actual.ruta !== ruta) actual = null;
}
