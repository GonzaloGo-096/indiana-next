import { describe, it, expect } from "vitest";
import {
  buildItemParamsFromAuto,
  buildItemParamsFromPlan,
  buildItemParamsFromUsado,
} from "../params";

// Estos tres datos son los que cruzan "vistas" contra "contactos" por auto en
// GA4 y en el tablero de Looker: si cambia la forma del nombre, se parten las
// filas del reporte.

describe("buildItemParamsFromAuto", () => {
  it("antepone la marca cuando el título no la trae", () => {
    expect(buildItemParamsFromAuto({ slug: "expert", titulo: "Expert" })).toEqual({
      item_id: "expert",
      item_name: "Peugeot Expert",
      item_category: "0km",
    });
  });

  it("no duplica la marca", () => {
    expect(buildItemParamsFromAuto({ slug: "208", titulo: "Peugeot 208" })?.item_name).toBe(
      "Peugeot 208",
    );
  });

  it("sin identificador no hay item", () => {
    expect(buildItemParamsFromAuto({ titulo: "208" })).toBeNull();
    expect(buildItemParamsFromAuto(null)).toBeNull();
  });
});

describe("buildItemParamsFromPlan", () => {
  it("arma 'Modelo · Plan' cuando el nombre no trae el modelo", () => {
    expect(buildItemParamsFromPlan({ id: "easy", nombre: "Easy", modelo: "208" })).toEqual({
      item_id: "easy",
      item_name: "208 · Easy",
      item_category: "plan",
    });
  });

  it("no repite el modelo si el nombre ya lo tiene", () => {
    const item = buildItemParamsFromPlan({ id: "x", nombre: "2008 Active T200", modelo: "2008" });
    expect(item?.item_name).toBe("2008 Active T200");
  });

  it("capitaliza el modelo", () => {
    const item = buildItemParamsFromPlan({ id: "x", nombre: "Carga", modelo: "expert" });
    expect(item?.item_name).toBe("Expert · Carga");
  });

  it("sin identificador no hay item", () => {
    expect(buildItemParamsFromPlan({ nombre: "Easy" })).toBeNull();
  });
});

describe("buildItemParamsFromUsado", () => {
  it("marca + modelo + año, y prefiere el slug como id", () => {
    expect(
      buildItemParamsFromUsado({
        _id: "abc",
        slug: "peugeot-208-2023-abc",
        marca: "Peugeot",
        modelo: "208",
        anio: 2023,
        precio: 1000,
      }),
    ).toEqual({
      item_id: "peugeot-208-2023-abc",
      item_name: "Peugeot 208 2023",
      item_category: "usado",
    });
  });

  it("acepta _id cuando no hay slug ni id", () => {
    expect(buildItemParamsFromUsado({ _id: "abc", marca: "VW" })?.item_id).toBe("abc");
  });

  it("sin nombre usa el id", () => {
    expect(buildItemParamsFromUsado({ id: "7" })?.item_name).toBe("7");
  });

  it("sin identificador no hay item", () => {
    expect(buildItemParamsFromUsado({ marca: "Ford" })).toBeNull();
    expect(buildItemParamsFromUsado(undefined)).toBeNull();
  });
});
