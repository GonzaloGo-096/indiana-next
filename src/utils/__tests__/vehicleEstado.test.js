/**
 * Tests de getEstado / isVendido / isPausado.
 *
 * Lo que se fija acá es el default: un auto sin `estado` es ACTIVO. Es lo que
 * mantiene producción funcionando igual mientras el backend no despliegue el
 * campo, así que si alguien lo cambia tiene que romper un test.
 */

import { describe, it, expect } from "vitest";
import { getEstado, isVendido, isPausado, ESTADOS } from "../vehicleEstado";

describe("getEstado — el default protege a producción", () => {
  it("un auto sin el campo es ACTIVO", () => {
    expect(getEstado({ marca: "Peugeot" })).toBe(ESTADOS.ACTIVO);
  });

  it("null, undefined y objeto vacío son ACTIVO", () => {
    expect(getEstado(null)).toBe(ESTADOS.ACTIVO);
    expect(getEstado(undefined)).toBe(ESTADOS.ACTIVO);
    expect(getEstado({})).toBe(ESTADOS.ACTIVO);
  });

  it("un estado que no conocemos cae en ACTIVO, no esconde el auto", () => {
    expect(getEstado({ estado: "RESERVADO" })).toBe(ESTADOS.ACTIVO);
  });

  it("un estado no textual no rompe", () => {
    expect(getEstado({ estado: 3 })).toBe(ESTADOS.ACTIVO);
    expect(getEstado({ estado: null })).toBe(ESTADOS.ACTIVO);
  });

  it("no confunde una propiedad heredada con un estado válido", () => {
    expect(getEstado({ estado: "toString" })).toBe(ESTADOS.ACTIVO);
  });
});

describe("getEstado — normalización", () => {
  it("lee los tres valores tal como los manda el backend", () => {
    expect(getEstado({ estado: "ACTIVO" })).toBe(ESTADOS.ACTIVO);
    expect(getEstado({ estado: "PAUSADO" })).toBe(ESTADOS.PAUSADO);
    expect(getEstado({ estado: "VENDIDO" })).toBe(ESTADOS.VENDIDO);
  });

  it("tolera minúsculas y espacios", () => {
    expect(getEstado({ estado: "vendido" })).toBe(ESTADOS.VENDIDO);
    expect(getEstado({ estado: "  Pausado " })).toBe(ESTADOS.PAUSADO);
  });
});

describe("isVendido / isPausado", () => {
  it("distinguen el estado sin mezclarse entre sí", () => {
    expect(isVendido({ estado: "VENDIDO" })).toBe(true);
    expect(isVendido({ estado: "PAUSADO" })).toBe(false);
    expect(isPausado({ estado: "PAUSADO" })).toBe(true);
    expect(isPausado({ estado: "VENDIDO" })).toBe(false);
  });

  it("un auto sin estado no es ni vendido ni pausado", () => {
    expect(isVendido({})).toBe(false);
    expect(isPausado({})).toBe(false);
  });
});
