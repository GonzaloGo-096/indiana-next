/**
 * Estado comercial de un auto. Lo guarda el backend en el campo `estado` y el
 * panel lo cambia con PATCH /photos/updatestatus/:id.
 *
 * Significado acordado con el backend (2026-08-28):
 *   ACTIVO   → se muestra normal
 *   VENDIDO  → se muestra con cartel, sirve de vidriera
 *   PAUSADO  → no se le muestra al visitante
 *
 * Se normaliza acá y no en cada componente porque el dato llega de dos fuentes
 * con historia distinta:
 *
 * 1. El backend de preview lo manda en MAYÚSCULAS ("ACTIVO"), verificado el
 *    2026-08-28 en GET /photos/getallphotos.
 * 2. El backend de producción todavía no tiene el campo, así que sus 44 autos
 *    llegan SIN `estado`.
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
