/**
 * Casos de borde (auditoría QA del 2026-10-07): fallbacks de nombre (nombre/modelo/id), plan sin nombre,
 * recorte/trim, ids numéricos, "peugeot" en minúsculas/mayúsculas.
 */
import { describe, it, expect } from "vitest";
import { buildItemParamsFromAuto, buildItemParamsFromPlan, buildItemParamsFromUsado } from "@/lib/analytics/params";

describe("buildItemParamsFromAuto: fallbacks", () => {
  it("sin título usa nombre, después modelo, después el id", () => {
    expect(buildItemParamsFromAuto({ slug: "s", nombre: "Partner" }).item_name).toBe("Peugeot Partner");
    expect(buildItemParamsFromAuto({ slug: "s", modelo: "3008" }).item_name).toBe("Peugeot 3008");
    expect(buildItemParamsFromAuto({ slug: "s" }).item_name).toBe("s");
  });

  it("'PEUGEOT 208' en mayúsculas no se duplica", () => {
    expect(buildItemParamsFromAuto({ slug: "208", titulo: "PEUGEOT 208" }).item_name).toBe("PEUGEOT 208");
  });

  it("slug gana sobre id; espacios se recortan", () => {
    expect(buildItemParamsFromAuto({ slug: " 208 ", id: "x", titulo: " 208 " })).toEqual({
      item_id: "208",
      item_name: "Peugeot 208",
      item_category: "0km",
    });
  });

  it("slug solo de espacios cuenta como sin identificador", () => {
    expect(buildItemParamsFromAuto({ slug: "   ", titulo: "208" })).toBeNull();
  });
});

describe("buildItemParamsFromPlan: fallbacks", () => {
  it("sin nombre de plan usa el modelo capitalizado", () => {
    expect(buildItemParamsFromPlan({ id: "p1", modelo: "partner" }).item_name).toBe("Partner");
  });

  it("sin nombre ni modelo usa el id", () => {
    expect(buildItemParamsFromPlan({ id: "p1" }).item_name).toBe("p1");
  });

  it("el modelo en el nombre se detecta sin importar mayúsculas", () => {
    expect(buildItemParamsFromPlan({ id: "x", nombre: "Plan EXPERT carga", modelo: "expert" }).item_name).toBe("Plan EXPERT carga");
  });

  it("acepta slug cuando no hay id, y titulo cuando no hay nombre", () => {
    expect(buildItemParamsFromPlan({ slug: "easy", titulo: "Easy", modelo: "208" })).toEqual({
      item_id: "easy",
      item_name: "208 · Easy",
      item_category: "plan",
    });
  });
});

describe("buildItemParamsFromUsado: bordes", () => {
  it("id numérico se convierte a string", () => {
    expect(buildItemParamsFromUsado({ id: 7, marca: "Ford" }).item_id).toBe("7");
  });

  it("id gana sobre _id", () => {
    expect(buildItemParamsFromUsado({ id: "a", _id: "b" }).item_id).toBe("a");
  });

  it("partes vacías o nulas no dejan espacios dobles", () => {
    expect(buildItemParamsFromUsado({ id: "a", marca: "Ford", modelo: null, anio: 2015 }).item_name).toBe("Ford 2015");
    expect(buildItemParamsFromUsado({ id: "a", marca: "  ", modelo: "Ka", anio: "" }).item_name).toBe("Ka");
  });

  it("cada parte se corta en 100 caracteres", () => {
    const item = buildItemParamsFromUsado({ id: "x".repeat(150), marca: "m".repeat(150) });
    expect(item.item_id).toHaveLength(100);
    expect(item.item_name).toHaveLength(100);
  });
});
