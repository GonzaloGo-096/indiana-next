/**
 * discount.js - Constantes y helpers del descuento (formato nuevo del backend)
 *
 * Modelo del backend (DiscountSchema, embebido en el vehículo):
 *   descuento: { valor: Number >= 0, tipo: 'PORCENTAJE' | 'MONTO_FIJO' }
 *
 * IMPORTANTE: el FRONT NO calcula el precio final. Solo junta { valor, tipo }
 * y se lo manda al backend. El backend hace toda la cuenta y nos devuelve el
 * precio ya calculado (precioOferta), que consumimos como siempre.
 *
 * Este módulo solo aporta: las constantes del tipo y un normalizador para
 * leer/prellenar el formulario sin magic strings.
 *
 * @author Indiana Peugeot
 */

export const DISCOUNT_TIPO = Object.freeze({
  PORCENTAJE: "PORCENTAJE",
  MONTO_FIJO: "MONTO_FIJO",
});

/** Default que coincide con el schema del backend. */
export const DEFAULT_DISCOUNT = Object.freeze({
  valor: 0,
  tipo: DISCOUNT_TIPO.MONTO_FIJO,
});

/**
 * Normaliza cualquier entrada a un objeto { valor, tipo } válido.
 * Tolera undefined, el objeto nuevo, o el formato viejo (número + oferta bool).
 *
 * @param {any} input - puede ser el objeto {valor,tipo} o un número (formato viejo)
 * @param {boolean} [ofertaLegacy] - flag `oferta` del formato viejo (si aplica)
 */
export function normalizeDiscount(input, ofertaLegacy) {
  // Formato nuevo: objeto { valor, tipo }
  if (input && typeof input === "object") {
    const tipo =
      input.tipo === DISCOUNT_TIPO.PORCENTAJE
        ? DISCOUNT_TIPO.PORCENTAJE
        : DISCOUNT_TIPO.MONTO_FIJO;
    const valor = Math.max(0, Number(input.valor) || 0);
    return { valor, tipo };
  }

  // Formato viejo: `descuento` era un número (%) + `oferta` bool
  const enOferta = ofertaLegacy === true || ofertaLegacy === "true";
  const valorViejo = Math.max(0, Number(input) || 0);
  return {
    valor: enOferta ? valorViejo : 0,
    tipo: DISCOUNT_TIPO.PORCENTAJE,
  };
}
