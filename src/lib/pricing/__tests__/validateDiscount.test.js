/**
 * Tests de validateDiscount.
 *
 * Es el espejo en el front de lo que valida el backend. Si esto se desincroniza,
 * el admin ve un error confuso al guardar (o peor: guarda algo que el backend
 * rechaza después).
 *
 * Devuelve el mensaje de error, o null si está OK.
 */

import { describe, it, expect } from "vitest";
import { validateDiscount } from "../validateDiscount";
import { DISCOUNT_TIPO } from "../discount";

const PORCENTAJE = DISCOUNT_TIPO.PORCENTAJE;
const MONTO_FIJO = DISCOUNT_TIPO.MONTO_FIJO;

describe("validateDiscount — campo vacío", () => {
  it("vacío, null o NaN se acepta: equivale a sin descuento", () => {
    // Fix "campo valor vacio = sin descuento (no bloquea guardar)": antes esto
    // devolvía un error y no dejaba guardar un auto sin oferta.
    for (const valor of ["", null, undefined, NaN]) {
      expect(validateDiscount({ valor, tipo: PORCENTAJE, precio: 1000000 })).toBeNull();
      expect(validateDiscount({ valor, tipo: MONTO_FIJO, precio: 1000000 })).toBeNull();
    }
  });
});

describe("validateDiscount — valores negativos", () => {
  it("rechaza un valor negativo, sea cual sea el tipo", () => {
    expect(validateDiscount({ valor: -1, tipo: PORCENTAJE, precio: 1000000 })).toMatch(
      /negativo/i,
    );
    expect(validateDiscount({ valor: -1, tipo: MONTO_FIJO, precio: 1000000 })).toMatch(
      /negativo/i,
    );
  });
});

describe("validateDiscount — PORCENTAJE", () => {
  it("acepta de 0 a 100", () => {
    for (const valor of [0, 1, 50, 99.9, 100]) {
      expect(validateDiscount({ valor, tipo: PORCENTAJE, precio: 1000000 })).toBeNull();
    }
  });

  it("rechaza más de 100", () => {
    // Fix "tope de 100 en el input cuando el tipo es PORCENTAJE".
    expect(validateDiscount({ valor: 101, tipo: PORCENTAJE, precio: 1000000 })).toMatch(
      /100/,
    );
  });

  it("el porcentaje NO se compara contra el precio", () => {
    // Un 50% es válido aunque el precio sea 10: el tope es 100, no el precio.
    expect(validateDiscount({ valor: 50, tipo: PORCENTAJE, precio: 10 })).toBeNull();
  });
});

describe("validateDiscount — MONTO_FIJO", () => {
  it("acepta un monto menor o igual al precio", () => {
    expect(validateDiscount({ valor: 999999, tipo: MONTO_FIJO, precio: 1000000 })).toBeNull();
    expect(validateDiscount({ valor: 1000000, tipo: MONTO_FIJO, precio: 1000000 })).toBeNull();
  });

  it("rechaza un monto mayor al precio (dejaría el precio final en negativo)", () => {
    expect(
      validateDiscount({ valor: 1000001, tipo: MONTO_FIJO, precio: 1000000 }),
    ).toMatch(/mayor que el precio/i);
  });

  it("NO tiene tope de 100: un monto de 500.000 es válido", () => {
    // Fix "el monto fijo no tiene ese tope (solo <= precio)".
    expect(validateDiscount({ valor: 500000, tipo: MONTO_FIJO, precio: 1000000 })).toBeNull();
  });

  it("sin precio conocido no se puede comparar, así que no se bloquea", () => {
    // Al crear un auto el precio puede no estar cargado todavía. El backend
    // hace la validación final.
    for (const precio of [undefined, null, 0, "", NaN, "abc"]) {
      expect(validateDiscount({ valor: 999999, tipo: MONTO_FIJO, precio })).toBeNull();
    }
  });

  it("acepta el precio como string (viene del formulario)", () => {
    expect(validateDiscount({ valor: 2000, tipo: MONTO_FIJO, precio: "1000" })).toMatch(
      /mayor que el precio/i,
    );
  });
});
