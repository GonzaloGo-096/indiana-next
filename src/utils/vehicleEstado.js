/**
 * Estado comercial de un auto. Lo guarda el backend en el campo `estado` y el
 * panel lo cambia con PATCH /photos/updatestatus/:id.
 *
 * Significado acordado con el backend (2026-08-28):
 *   ACTIVO   → se muestra normal
 *   VENDIDO  → se muestra con cartel, sirve de vidriera. Solo en el listado de
 *              usados y siempre al final (decisión de Gonzalo, 2026-09-23);
 *              nunca en los carruseles.
 *   PAUSADO  → no se le muestra al visitante
 *
 * Se normaliza acá y no en cada componente porque el dato llega de dos fuentes
 * con historia distinta:
 *
 * 1. El backend de preview lo manda en MAYÚSCULAS ("ACTIVO"), verificado el
 *    2026-08-28 en GET /photos/getallphotos.
 * 2. El backend de producción todavía no tiene el campo, así que sus autos
 *    llegan SIN `estado` (verificado el 2026-09-23: 28 autos, ninguno con estado).
 *
 * Por eso un auto sin estado es ACTIVO: es el default del backend y es lo que
 * hace que el sitio en producción se siga viendo igual que hoy hasta que
 * desplieguen el campo. Sin ese default, el día del deploy los autos viejos
 * quedarían en un estado indefinido.
 *
 * Un valor desconocido (si mañana agregan RESERVADO) también cae en ACTIVO: es
 * el lado seguro del error. Esconder un auto que sí está a la venta cuesta
 * plata; mostrarlo sin cartel, no.
 */

export const ESTADOS = {
  ACTIVO: "ACTIVO",
  PAUSADO: "PAUSADO",
  VENDIDO: "VENDIDO",
};

const ESTADOS_CONOCIDOS = new Set(Object.values(ESTADOS));

/**
 * @param {Object} auto - Auto tal como lo devuelve el backend (o el mapper)
 * @returns {"ACTIVO"|"PAUSADO"|"VENDIDO"}
 */
export function getEstado(auto) {
  const crudo = auto?.estado;
  if (typeof crudo !== "string") return ESTADOS.ACTIVO;

  const normalizado = crudo.trim().toUpperCase();
  return ESTADOS_CONOCIDOS.has(normalizado) ? normalizado : ESTADOS.ACTIVO;
}

export const isVendido = (auto) => getEstado(auto) === ESTADOS.VENDIDO;

export const isPausado = (auto) => getEstado(auto) === ESTADOS.PAUSADO;

/**
 * Los vendidos al final; todos los demás conservan su orden (el del backend o
 * el que eligió el visitante).
 *
 * Ordena solo lo que ya está cargado: el listado viene paginado y el backend
 * no ordena por estado, así que al cargar la página siguiente sus activos
 * quedan arriba de los vendidos de antes. Para que los vendidos queden al
 * final de todo el inventario desde la primera página, el backend tendría que
 * ordenar por estado.
 *
 * @param {Object[]} autos
 * @returns {Object[]} Lista nueva; no modifica la original
 */
export function vendidosAlFinal(autos = []) {
  const disponibles = [];
  const vendidos = [];
  for (const auto of autos) {
    (isVendido(auto) ? vendidos : disponibles).push(auto);
  }
  return [...disponibles, ...vendidos];
}

/**
 * La lista sin los vendidos. Para los carruseles: ahí no se muestran.
 *
 * @param {Object[]} autos
 * @returns {Object[]}
 */
export const sinVendidos = (autos = []) => autos.filter((auto) => !isVendido(auto));
