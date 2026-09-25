/**
 * Estado comercial de un auto. Lo guarda el backend en el campo `estado` y el
 * panel lo cambia con PATCH /photos/updatestatus/:id. El contrato completo
 * (qué ve cada uno, quién decide) está en docs/estados-de-autos.md.
 *
 *   ACTIVO   → se muestra normal
 *   VENDIDO  → se muestra con cartel, sirve de vidriera. Solo en el listado de
 *              usados y siempre al final (decisión de Gonzalo, 2026-09-23);
 *              nunca en los carruseles.
 *   PAUSADO  → no se le muestra al visitante; el panel sí lo ve.
 *
 * El backend lo manda en MAYÚSCULAS y, desde el 2026-09-24, en todos los autos
 * (producción verificada: 28 de 28 con estado). Igual se normaliza acá y no en
 * cada componente, porque un dato de afuera no se da por bueno:
 *
 * - Un auto SIN estado es ACTIVO: es el default del backend, y fue lo que
 *   mantuvo la web igual mientras producción no tenía el campo.
 * - Un valor desconocido (si mañana agregan RESERVADO) también cae en ACTIVO:
 *   es el lado seguro del error. Esconder un auto que sí está a la venta
 *   cuesta plata; mostrarlo sin cartel, no.
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

/** Cómo se nombra cada estado en pantalla. Única fuente: panel y mensajes. */
export const ETIQUETAS_ESTADO = {
  [ESTADOS.ACTIVO]: "Disponible",
  [ESTADOS.VENDIDO]: "Vendido",
  [ESTADOS.PAUSADO]: "Pausado",
};

/**
 * Cuántos autos hay en cada estado (para el filtro del panel).
 * @param {Object[]} autos
 * @returns {{ACTIVO: number, VENDIDO: number, PAUSADO: number}}
 */
export function contarPorEstado(autos = []) {
  const cuenta = { [ESTADOS.ACTIVO]: 0, [ESTADOS.VENDIDO]: 0, [ESTADOS.PAUSADO]: 0 };
  for (const auto of autos) cuenta[getEstado(auto)] += 1;
  return cuenta;
}

/**
 * Los vendidos al final; todos los demás conservan su orden (el del backend o
 * el que eligió el visitante).
 *
 * Es "al final de todo el inventario" porque el listado trae todos los autos
 * en un solo pedido y pagina en pantalla (ver useVehiclesList). Si algún día
 * vuelve a paginar en el backend, esto ordenaría solo lo cargado: para
 * mantener la regla, el backend tendría que ordenar por estado.
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
