/**
 * El auto (o plan) de la ficha que se está viendo.
 *
 * Lo anota ItemViewTracker al abrir la ficha y lo lee el WhatsApp flotante
 * al hacer clic: el flotante vive en el layout y no sabe en qué ficha está,
 * y es el 70% de los contactos. Se guarda con su ruta para que, al salir de
 * la ficha, el flotante deje de mandar ese auto.
 */

let actual = null;

export function setPageItem(item) {
  if (typeof window === "undefined" || !item?.item_id) return;
  actual = { ruta: window.location.pathname, item };
}

export function getPageItem() {
  if (typeof window === "undefined" || !actual) return null;
  return actual.ruta === window.location.pathname ? actual.item : null;
}
