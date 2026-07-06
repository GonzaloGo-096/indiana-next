/**
 * validateDiscount.js - Validación del descuento (espejo del backend)
 *
 * Reglas (deben coincidir con lo que valida el backend):
 * - valor >= 0 siempre
 * - PORCENTAJE: 0 <= valor <= 100
 * - MONTO_FIJO: valor <= precio del auto (para que el precio final no sea negativo)
 *
 * Devuelve un string con el mensaje de error, o null si es válido.
 *
 * @author Indiana Peugeot
 */

import { DISCOUNT_TIPO } from "./discount";

/**
 * @param {{ valor:any, tipo:string, precio:any }} params
 * @returns {string|null} mensaje de error, o null si está OK
 */
export function validateDiscount({ valor, tipo, precio }) {
  const v = Number(valor);

  if (!Number.isFinite(v) || v < 0) {
    return "El valor del descuento debe ser un número mayor o igual a 0";
  }

  if (tipo === DISCOUNT_TIPO.PORCENTAJE) {
    if (v > 100) {
      return "El porcentaje no puede ser mayor a 100";
    }
    return null;
  }

  // MONTO_FIJO
  const p = Number(precio);
  if (Number.isFinite(p) && p > 0 && v > p) {
    return "El monto del descuento no puede ser mayor que el precio del auto";
  }

  return null;
}
