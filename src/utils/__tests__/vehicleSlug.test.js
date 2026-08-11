/**
 * Tests de vehicleSlug.
 *
 * Arma y lee las URLs de las fichas (/usados/marca-modelo-anio-id). Si esto se
 * rompe, se rompen los links del listado, el canonical del SEO y el warmup de
 * caché a la vez.
 */

import { describe, it, expect } from "vitest";
import { slugify, buildVehicleDetailUrl, parseVehicleSlugParam } from "../vehicleSlug";

const ID = "699e2aa373f578ed9ede40cf"; // 24 hex, formato ObjectId de Mongo

describe("slugify", () => {
  it("pasa a minúsculas y separa con guiones", () => {
    expect(slugify("Peugeot 208")).toBe("peugeot-208");
  });

  it("saca las tildes y la diéresis", () => {
    expect(slugify("Citroën C4 Cactus")).toBe("citroen-c4-cactus");
    expect(slugify("Perú")).toBe("peru");
  });

  it("colapsa símbolos y espacios repetidos en un solo guión", () => {
    expect(slugify("Peugeot   208  //  GT")).toBe("peugeot-208-gt");
  });

  it("no deja guiones sueltos en los bordes", () => {
    expect(slugify("  -208-  ")).toBe("208");
  });

  it("tolera entradas que no son texto", () => {
    for (const entrada of [null, undefined, 123, {}, []]) {
      expect(slugify(entrada)).toBe("");
    }
  });
});

describe("buildVehicleDetailUrl", () => {
  it("arma la URL con marca, modelo, año e id", () => {
    expect(
      buildVehicleDetailUrl({ id: ID, marca: "Peugeot", modelo: "208", anio: 2021 }),
    ).toBe(`/usados/peugeot-208-2021-${ID}`);
  });

  it("incluye la versión cuando existe", () => {
    expect(
      buildVehicleDetailUrl({ id: ID, marca: "Peugeot", modelo: "208", version: "Allure", anio: 2021 }),
    ).toBe(`/usados/peugeot-208-allure-2021-${ID}`);
  });

  it("acepta _id además de id", () => {
    expect(buildVehicleDetailUrl({ _id: ID, marca: "Honda" })).toBe(`/usados/honda-${ID}`);
  });

  it('acepta "año" con eñe además de "anio"', () => {
    expect(buildVehicleDetailUrl({ id: ID, marca: "Ford", año: 2019 })).toBe(
      `/usados/ford-2019-${ID}`,
    );
  });

  it("saltea los campos vacíos sin dejar guiones dobles", () => {
    expect(
      buildVehicleDetailUrl({ id: ID, marca: "Fiat", modelo: "", version: null, anio: 2020 }),
    ).toBe(`/usados/fiat-2020-${ID}`);
  });

  it("si no hay ningún dato descriptivo, deja solo el id", () => {
    expect(buildVehicleDetailUrl({ id: ID })).toBe(`/usados/${ID}`);
  });

  it("limpia texto pegado accidentalmente al id", () => {
    // Caso real: un id copiado desde un chat con texto adherido.
    expect(buildVehicleDetailUrl({ id: `${ID} Si ahí tam`, marca: "Peugeot" })).toBe(
      `/usados/peugeot-${ID}`,
    );
  });

  it("falla fuerte si no hay vehículo o no hay id", () => {
    expect(() => buildVehicleDetailUrl(null)).toThrow();
    expect(() => buildVehicleDetailUrl({})).toThrow();
    expect(() => buildVehicleDetailUrl({ id: "   " })).toThrow();
  });
});

describe("parseVehicleSlugParam", () => {
  it("extrae el id de una URL con slug y NO pide redirección", () => {
    expect(parseVehicleSlugParam(`peugeot-208-allure-2021-${ID}`)).toEqual({
      id: ID,
      needsRedirect: false,
    });
  });

  it("acepta una URL vieja de solo id, pero pide redirección al canónico", () => {
    expect(parseVehicleSlugParam(ID)).toEqual({ id: ID, needsRedirect: true });
  });

  it("normaliza el id a minúsculas (el backend los espera así)", () => {
    expect(parseVehicleSlugParam(ID.toUpperCase()).id).toBe(ID);
    expect(parseVehicleSlugParam(`peugeot-208-${ID.toUpperCase()}`).id).toBe(ID);
  });

  it("devuelve id null cuando el segmento no tiene un id válido", () => {
    for (const entrada of ["peugeot-208", "", "no-es-un-id", "123", null, undefined, 42]) {
      expect(parseVehicleSlugParam(entrada).id).toBeNull();
    }
  });

  it("ida y vuelta: lo que arma buildVehicleDetailUrl se puede volver a leer", () => {
    const url = buildVehicleDetailUrl({
      id: ID,
      marca: "Citroën",
      modelo: "C4 Cactus",
      anio: 2018,
    });
    const segmento = url.replace("/usados/", "");
    expect(parseVehicleSlugParam(segmento)).toEqual({ id: ID, needsRedirect: false });
  });
});
