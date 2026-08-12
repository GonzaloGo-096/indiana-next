/**
 * Tests de normalizeDiscount.
 *
 * Este módulo no tenía tests y es donde más se tocó: los últimos 5 commits del
 * proyecto antes de la reestructuración fueron fixes encadenados sobre el
 * descuento. Cada uno de esos fixes está acá como caso, así que si alguien
 * vuelve a romper lo mismo, salta.
 *
 * Contrato: el front NO calcula el precio final. Solo junta { valor, tipo } y
 * se lo manda al backend, que hace la cuenta y devuelve precioOferta.
 */

import { describe, it, expect } from "vitest";
import { normalizeDiscount, DISCOUNT_TIPO, DEFAULT_DISCOUNT } from "../discount";

describe("normalizeDiscount — formato nuevo { valor, tipo }", () => {
  it("respeta un descuento por porcentaje", () => {
    expect(normalizeDiscount({ valor: 15, tipo: "PORCENTAJE" })).toEqual({
      valor: 15,
      tipo: DISCOUNT_TIPO.PORCENTAJE,
    });
  });

  it("respeta un descuento por monto fijo", () => {
    expect(normalizeDiscount({ valor: 500000, tipo: "MONTO_FIJO" })).toEqual({
      valor: 500000,
      tipo: DISCOUNT_TIPO.MONTO_FIJO,
    });
  });

  it("cualquier tipo desconocido cae en MONTO_FIJO", () => {
    // Es el default del schema del backend.
    expect(normalizeDiscount({ valor: 10, tipo: "CUALQUIERA" }).tipo).toBe(
      DISCOUNT_TIPO.MONTO_FIJO,
    );
    expect(normalizeDiscount({ valor: 10 }).tipo).toBe(DISCOUNT_TIPO.MONTO_FIJO);
  });

  it("nunca devuelve un valor negativo", () => {
    expect(normalizeDiscount({ valor: -50, tipo: "PORCENTAJE" }).valor).toBe(0);
  });

  it("un valor vacío o no numérico equivale a sin descuento", () => {
    // Fix "campo valor vacio = sin descuento": react-hook-form con
    // valueAsNumber convierte el input vacío en NaN. No es un error: es 0.
    for (const valor of ["", null, undefined, NaN, "no es un numero"]) {
      expect(normalizeDiscount({ valor, tipo: "PORCENTAJE" }).valor).toBe(0);
    }
  });

  it("acepta el valor como string numérico (viene del formulario)", () => {
    expect(normalizeDiscount({ valor: "25", tipo: "PORCENTAJE" }).valor).toBe(25);
  });

  it("acepta decimales (el input es step=any, no múltiplos de 1000)", () => {
    // Fix "permitir cualquier valor en el input (step=any)".
    expect(normalizeDiscount({ valor: 12.5, tipo: "PORCENTAJE" }).valor).toBe(12.5);
    expect(normalizeDiscount({ valor: 1234.56, tipo: "MONTO_FIJO" }).valor).toBe(1234.56);
  });
});

describe("normalizeDiscount — formato viejo (número + flag oferta)", () => {
  it("con oferta true, toma el número como porcentaje", () => {
    expect(normalizeDiscount(20, true)).toEqual({
      valor: 20,
      tipo: DISCOUNT_TIPO.PORCENTAJE,
    });
  });

  it("con oferta false, descarta el valor: no hay descuento", () => {
    expect(normalizeDiscount(20, false)).toEqual({
      valor: 0,
      tipo: DISCOUNT_TIPO.PORCENTAJE,
    });
  });

  it('acepta el flag como el string "true"', () => {
    expect(normalizeDiscount(20, "true").valor).toBe(20);
  });

  it("sin entrada devuelve sin descuento", () => {
    expect(normalizeDiscount(undefined).valor).toBe(0);
    expect(normalizeDiscount(null).valor).toBe(0);
  });
});

describe("constantes", () => {
  it("el default coincide con el schema del backend", () => {
    expect(DEFAULT_DISCOUNT).toEqual({ valor: 0, tipo: DISCOUNT_TIPO.MONTO_FIJO });
  });

  it("las constantes están congeladas para que nadie las mute", () => {
    expect(Object.isFrozen(DISCOUNT_TIPO)).toBe(true);
    expect(Object.isFrozen(DEFAULT_DISCOUNT)).toBe(true);
  });
});
