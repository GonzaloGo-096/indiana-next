/**
 * Tests unitarios para analytics/params.js
 *
 * Cobertura:
 *   - toNumberOrNull: todos los formatos de precio posibles del backend
 *   - buildItemParamsFromUsado
 *   - buildItemParamsFromAuto
 *   - buildItemParamsFromPlan
 *   - buildSearchFiltersParams
 */

import { describe, it, expect } from "vitest";
import {
  toNumberOrNull,
  buildItemParamsFromUsado,
  buildItemParamsFromAuto,
  buildItemParamsFromPlan,
  buildSearchFiltersParams,
} from "../params";

// ---------------------------------------------------------------------------
// toNumberOrNull
// ---------------------------------------------------------------------------

describe("toNumberOrNull", () => {
  describe("null / undefined / edge cases", () => {
    it("devuelve null para null", () => expect(toNumberOrNull(null)).toBeNull());
    it("devuelve null para undefined", () => expect(toNumberOrNull(undefined)).toBeNull());
    it("devuelve null para string vacío", () => expect(toNumberOrNull("")).toBeNull());
    it("devuelve null para '-'", () => expect(toNumberOrNull("-")).toBeNull());
    it("devuelve null para NaN", () => expect(toNumberOrNull(NaN)).toBeNull());
    it("devuelve null para Infinity", () => expect(toNumberOrNull(Infinity)).toBeNull());
    it("devuelve null para -Infinity", () => expect(toNumberOrNull(-Infinity)).toBeNull());
    it("devuelve null para string no numérico", () => expect(toNumberOrNull("abc")).toBeNull());
  });

  describe("número nativo", () => {
    it("devuelve entero sin cambios", () => expect(toNumberOrNull(22557000)).toBe(22557000));
    it("devuelve float sin cambios", () => expect(toNumberOrNull(22557000.5)).toBe(22557000.5));
    it("devuelve cero", () => expect(toNumberOrNull(0)).toBe(0));
    it("devuelve negativo", () => expect(toNumberOrNull(-500)).toBe(-500));
  });

  describe("string — formato JSON/MongoDB (punto decimal — BUG anterior)", () => {
    it("NO infla precio: '22557000.000000' → 22557000", () =>
      expect(toNumberOrNull("22557000.000000")).toBe(22557000));

    it("NO infla precio: '22557000.00' → 22557000", () =>
      expect(toNumberOrNull("22557000.00")).toBe(22557000));

    it("preserva centavos: '22557000.50' → 22557000.5", () =>
      expect(toNumberOrNull("22557000.50")).toBe(22557000.5));

    it("string entero limpio: '22557000' → 22557000", () =>
      expect(toNumberOrNull("22557000")).toBe(22557000));

    it("con símbolo de moneda: '$ 22557000.000000' → 22557000", () =>
      expect(toNumberOrNull("$ 22557000.000000")).toBe(22557000));
  });

  describe("string — formato argentino (puntos miles)", () => {
    it("'22.557.000' → 22557000", () =>
      expect(toNumberOrNull("22.557.000")).toBe(22557000));

    it("'22.557.000,00' → 22557000", () =>
      expect(toNumberOrNull("22.557.000,00")).toBe(22557000));

    it("'22.557.000,50' → 22557000.5", () =>
      expect(toNumberOrNull("22.557.000,50")).toBe(22557000.5));

    it("'$ 22.557.000' → 22557000", () =>
      expect(toNumberOrNull("$ 22.557.000")).toBe(22557000));

    it("'ARS 1.500.000' → 1500000", () =>
      expect(toNumberOrNull("ARS 1.500.000")).toBe(1500000));

    it("'1.000' (miles AR, precio chico) → 1000", () =>
      expect(toNumberOrNull("1.000")).toBe(1000));
  });

  describe("string — formato US (comas miles)", () => {
    it("'22,557,000' → 22557000", () =>
      expect(toNumberOrNull("22,557,000")).toBe(22557000));

    it("'1,500,000' → 1500000", () =>
      expect(toNumberOrNull("1,500,000")).toBe(1500000));
  });

  describe("string — mixed (ambos separadores)", () => {
    it("'22,557.00' (coma miles, punto decimal) → 22557", () =>
      expect(toNumberOrNull("22,557.00")).toBe(22557));

    it("'22.557,00' (punto miles, coma decimal) → 22557", () =>
      expect(toNumberOrNull("22.557,00")).toBe(22557));
  });

  describe("string — coma decimal solitaria", () => {
    it("'22557,50' → 22557.5", () =>
      expect(toNumberOrNull("22557,50")).toBe(22557.5));
  });
});

// ---------------------------------------------------------------------------
// buildItemParamsFromUsado
// ---------------------------------------------------------------------------

describe("buildItemParamsFromUsado", () => {
  const base = {
    id: "auto-123",
    marca: "Ford",
    modelo: "Falcon",
    version: "Rural",
  };

  it("devuelve null para input inválido", () => {
    expect(buildItemParamsFromUsado(null)).toBeNull();
    expect(buildItemParamsFromUsado(undefined)).toBeNull();
    expect(buildItemParamsFromUsado("string")).toBeNull();
  });

  it("devuelve null si no hay id", () => {
    expect(buildItemParamsFromUsado({ marca: "Ford" })).toBeNull();
  });

  it("estructura básica correcta", () => {
    const result = buildItemParamsFromUsado(base, "usados");
    expect(result).toMatchObject({
      item_id: "auto-123",
      item_name: "Ford Falcon",
      item_brand: "Ford",
      item_variant: "Rural",
      item_category: "usado",
      currency: "ARS",
      item_list_name: "usados",
    });
  });

  it("acepta _id como identificador", () => {
    const result = buildItemParamsFromUsado({ _id: "abc-456", marca: "VW", modelo: "Gol" });
    expect(result?.item_id).toBe("abc-456");
  });

  it("precio entero correcto", () => {
    const result = buildItemParamsFromUsado({ ...base, precio: 22557000 });
    expect(result?.price).toBe(22557000);
  });

  it("precio string JSON/MongoDB sin inflación", () => {
    const result = buildItemParamsFromUsado({ ...base, precio: "22557000.000000" });
    expect(result?.price).toBe(22557000);
  });

  it("precio string format argentino sin inflación", () => {
    const result = buildItemParamsFromUsado({ ...base, precio: "22.557.000" });
    expect(result?.price).toBe(22557000);
  });

  it("precio null omitido del resultado (pruneNulls)", () => {
    const result = buildItemParamsFromUsado({ ...base, precio: null });
    expect(result).not.toHaveProperty("price");
  });

  it("precio undefined omitido del resultado", () => {
    const result = buildItemParamsFromUsado(base);
    expect(result).not.toHaveProperty("price");
  });

  it("item_category siempre presente aunque precio sea null", () => {
    const result = buildItemParamsFromUsado(base);
    expect(result?.item_category).toBe("usado");
  });

  it("slug tiene prioridad sobre id como item_id", () => {
    const result = buildItemParamsFromUsado({ ...base, slug: "ford-falcon-rural", id: "123" });
    expect(result?.item_id).toBe("ford-falcon-rural");
  });
});

// ---------------------------------------------------------------------------
// buildItemParamsFromAuto
// ---------------------------------------------------------------------------

describe("buildItemParamsFromAuto", () => {
  const base = {
    slug: "peugeot-208",
    titulo: "Peugeot 208",
    versiones: ["Active", "Allure"],
    precio: 25000000,
  };

  it("devuelve null para input inválido", () => {
    expect(buildItemParamsFromAuto(null)).toBeNull();
    expect(buildItemParamsFromAuto({})).toBeNull();
  });

  it("estructura correcta", () => {
    const result = buildItemParamsFromAuto(base, "0km");
    expect(result).toMatchObject({
      item_id: "peugeot-208",
      item_name: "Peugeot 208",
      item_brand: "Peugeot",
      item_variant: "Active/Allure",
      item_category: "0km",
      price: 25000000,
      currency: "ARS",
      item_list_name: "0km",
    });
  });

  it("precio string MongoDB sin inflación", () => {
    const result = buildItemParamsFromAuto({ ...base, precio: "25000000.000000" });
    expect(result?.price).toBe(25000000);
  });

  it("precio string argentino sin inflación", () => {
    const result = buildItemParamsFromAuto({ ...base, precio: "25.000.000" });
    expect(result?.price).toBe(25000000);
  });

  it("item_category = '0km' siempre", () => {
    expect(buildItemParamsFromAuto(base)?.item_category).toBe("0km");
  });
});

// ---------------------------------------------------------------------------
// buildItemParamsFromPlan
// ---------------------------------------------------------------------------

describe("buildItemParamsFromPlan", () => {
  const base = {
    id: "plan-208",
    nombre: "Plan 208 Active",
    modelo: "208",
    cuota: "185000.500000",
  };

  it("devuelve null para input inválido", () => {
    expect(buildItemParamsFromPlan(null)).toBeNull();
    expect(buildItemParamsFromPlan({})).toBeNull();
  });

  it("cuota string MongoDB parseada sin inflación", () => {
    const result = buildItemParamsFromPlan(base);
    expect(result?.price).toBe(185000.5);
  });

  it("item_category = 'plan' siempre", () => {
    expect(buildItemParamsFromPlan(base)?.item_category).toBe("plan");
  });

  it("item_brand = Peugeot siempre", () => {
    expect(buildItemParamsFromPlan(base)?.item_brand).toBe("Peugeot");
  });
});

// ---------------------------------------------------------------------------
// buildSearchFiltersParams
// ---------------------------------------------------------------------------

describe("buildSearchFiltersParams", () => {
  it("devuelve objeto vacío para null (early return sin filters_count)", () => {
    expect(buildSearchFiltersParams(null)).toEqual({});
  });

  it("parsea precio_min string mongolDB sin inflación", () => {
    const result = buildSearchFiltersParams({ precioMin: "5000000.000000" });
    expect(result.precio_min).toBe(5000000);
  });

  it("parsea precio_max string argentino", () => {
    const result = buildSearchFiltersParams({ precioMax: "30.000.000" });
    expect(result.precio_max).toBe(30000000);
  });

  it("filters_count refleja cantidad de filtros activos", () => {
    const result = buildSearchFiltersParams({
      marca: "Ford",
      precioMin: "5000000",
      precioMax: "20000000",
    });
    expect(result.filters_count).toBe(3);
  });
});
