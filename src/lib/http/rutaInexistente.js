/**
 * ¿Un 404 del backend significa "esa operación no existe"?
 *
 * Un 404 puede ser "ese recurso no existe" (p. ej. "Auto no encontrado") o
 * "esa ruta no existe", que es lo que pasa cuando el backend está
 * desactualizado respecto de la web. Se distinguen por el cuerpo: el backend
 * responde { msg: "Ruta no encontrada" } (verificado el 2026-09-24) y un
 * Express sin ese manejador, una página HTML.
 *
 * @param {string} contentType - Content-Type de la respuesta
 * @param {string} cuerpo - Cuerpo de la respuesta, como texto
 * @returns {boolean}
 */
export function esRutaInexistente(contentType, cuerpo) {
  if (!String(contentType).includes("application/json")) return true;
  try {
    return JSON.parse(cuerpo)?.msg === "Ruta no encontrada";
  } catch {
    return true; // dice ser JSON y no lo es: tampoco es la respuesta de la operación
  }
}
