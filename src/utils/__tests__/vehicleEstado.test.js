/**
 * Tests de getEstado / isVendido / isPausado.
 *
 * Lo que se fija acá es el default: un auto sin `estado` es ACTIVO. Es lo que
 * mantiene producción funcionando igual mientras el backend no despliegue el
 * campo, así que si alguien lo cambia tiene que romper un test.
 */

import { describe, it, expect } from "vitest";
import {
  getEstado,
  isVendido,
  isPausado,
  ESTADOS,
  vendidosAlFinal,
  sinVendidos,
  contarPorEstado,
  ETIQUETAS_ESTADO,
} from "../vehicleEstado";

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

// Decisión de producto (2026-09-23): los vendidos solo en el listado de
// usados, siempre al final; nunca en carruseles.
const auto = (id, estado) => (estado ? { id, estado } : { id });
const ids = (autos) => autos.map((a) => a.id);

describe("vendidosAlFinal", () => {
  it("manda los vendidos al final sin alterar el orden de cada grupo", () => {
    const lista = [
      auto(1, "VENDIDO"),
      auto(2, "ACTIVO"),
      auto(3, "VENDIDO"),
      auto(4),
      auto(5, "ACTIVO"),
    ];
    expect(ids(vendidosAlFinal(lista))).toEqual([2, 4, 5, 1, 3]);
  });

  it("reconoce el estado aunque venga en minúsculas", () => {
    expect(ids(vendidosAlFinal([auto(1, "vendido"), auto(2)]))).toEqual([2, 1]);
  });

  it("sin vendidos deja la lista igual", () => {
    expect(ids(vendidosAlFinal([auto(1), auto(2, "ACTIVO")]))).toEqual([1, 2]);
  });

  it("no modifica la lista original", () => {
    const lista = [auto(1, "VENDIDO"), auto(2)];
    vendidosAlFinal(lista);
    expect(ids(lista)).toEqual([1, 2]);
  });

  it("tolera una lista vacía o ausente", () => {
    expect(vendidosAlFinal([])).toEqual([]);
    expect(vendidosAlFinal()).toEqual([]);
  });
});

describe("sinVendidos", () => {
  it("saca solo los vendidos; los sin estado quedan (son activos)", () => {
    const lista = [auto(1, "VENDIDO"), auto(2, "ACTIVO"), auto(3), auto(4, "vendido")];
    expect(ids(sinVendidos(lista))).toEqual([2, 3]);
  });
});

describe("contarPorEstado", () => {
  it("cuenta cada estado; sin estado o desconocido cuenta como ACTIVO", () => {
    const lista = [
      { estado: "VENDIDO" },
      { estado: "PAUSADO" },
      { estado: "ACTIVO" },
      {},
      { estado: "RESERVADO" },
    ];
    expect(contarPorEstado(lista)).toEqual({ ACTIVO: 3, VENDIDO: 1, PAUSADO: 1 });
  });

  it("lista vacía: todo en cero", () => {
    expect(contarPorEstado([])).toEqual({ ACTIVO: 0, VENDIDO: 0, PAUSADO: 0 });
  });
});

describe("ETIQUETAS_ESTADO", () => {
  it("hay una etiqueta para cada estado", () => {
    for (const estado of Object.values(ESTADOS)) {
      expect(typeof ETIQUETAS_ESTADO[estado]).toBe("string");
    }
  });
});
