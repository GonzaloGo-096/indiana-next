/**
 * Tests de vehicleMapper.
 *
 * Traduce lo que manda el backend a la forma que usa el sitio. Es el punto por
 * donde pasan TODOS los vehículos: listado, detalle, inicio y carruseles. Si
 * acá se pierde un campo, desaparece en todas partes a la vez.
 *
 * Lo más delicado que hace es corregir la paginación: el backend a veces
 * devuelve un `nextPage` inválido y el mapper lo recalcula. Sin eso, el
 * "cargar más" del listado se queda pidiendo siempre la misma página.
 */

import { describe, it, expect } from "vitest";
import { mapVehiclesPage, mapVehicle } from "../vehicleMapper";

const FOTO = { url: "https://res.cloudinary.com/x/image/upload/v1/principal.webp" };
const HOVER = { url: "https://res.cloudinary.com/x/image/upload/v1/hover.webp" };

function backendPage(docs, extra = {}) {
  return { allPhotos: { docs, totalDocs: docs.length, hasNextPage: false, ...extra } };
}

describe("mapVehiclesPage — campos del vehículo", () => {
  it("conserva todos los campos del backend (passthrough)", () => {
    const { vehicles } = mapVehiclesPage(
      backendPage([{ _id: "abc", marca: "Peugeot", modelo: "208", precio: 10000000, anio: 2021 }]),
    );
    expect(vehicles[0]).toMatchObject({
      marca: "Peugeot",
      modelo: "208",
      precio: 10000000,
      anio: 2021,
    });
  });

  it("normaliza _id a id", () => {
    const { vehicles } = mapVehiclesPage(backendPage([{ _id: "abc123" }]));
    expect(vehicles[0].id).toBe("abc123");
  });

  it("arma el título con marca y modelo", () => {
    const { vehicles } = mapVehiclesPage(backendPage([{ _id: "a", marca: "Peugeot", modelo: "208" }]));
    expect(vehicles[0].title).toBe("Peugeot 208");
  });

  it("con un solo dato, el título usa el que haya", () => {
    const { vehicles } = mapVehiclesPage(backendPage([{ _id: "a", marca: "Peugeot" }]));
    expect(vehicles[0].title).toBe("Peugeot");
  });

  it("extrae las imágenes como strings", () => {
    const { vehicles } = mapVehiclesPage(
      backendPage([{ _id: "a", fotoPrincipal: FOTO, fotoHover: HOVER }]),
    );
    expect(vehicles[0].fotoPrincipal).toBe(FOTO.url);
    expect(vehicles[0].fotoHover).toBe(HOVER.url);
    // alias que usan componentes viejos
    expect(vehicles[0].imagen).toBe(FOTO.url);
  });

  it("sin imágenes deja strings vacíos, no undefined", () => {
    const { vehicles } = mapVehiclesPage(backendPage([{ _id: "a" }]));
    expect(vehicles[0].fotoPrincipal).toBe("");
    expect(vehicles[0].imagen).toBe("");
  });

  it("descarta las entradas que no son objetos", () => {
    const { vehicles } = mapVehiclesPage(backendPage([{ _id: "a" }, null, "basura", 42]));
    expect(vehicles).toHaveLength(1);
  });
});

describe("mapVehiclesPage — paginación", () => {
  it("respeta el nextPage del backend cuando es coherente", () => {
    const r = mapVehiclesPage(backendPage([{ _id: "a" }], { hasNextPage: true, nextPage: 3 }), 2);
    expect(r.nextPage).toBe(3);
  });

  it("recalcula el nextPage cuando el backend devuelve uno inválido", () => {
    // Este es el bug que el mapper existe para tapar: si el backend repite el
    // cursor actual, el "cargar más" pediría siempre la misma página.
    const r = mapVehiclesPage(backendPage([{ _id: "a" }], { hasNextPage: true, nextPage: 2 }), 2);
    expect(r.nextPage).toBe(3);
  });

  it("recalcula también si el backend no manda nextPage", () => {
    const r = mapVehiclesPage(backendPage([{ _id: "a" }], { hasNextPage: true }), 5);
    expect(r.nextPage).toBe(6);
  });

  it("sin más páginas, nextPage queda en null", () => {
    const r = mapVehiclesPage(backendPage([{ _id: "a" }], { hasNextPage: false, nextPage: 9 }), 1);
    expect(r.nextPage).toBeNull();
    expect(r.hasNextPage).toBe(false);
  });

  it("calcula el total de páginas", () => {
    const r = mapVehiclesPage(backendPage([{ _id: "a" }], { totalDocs: 20 }));
    expect(r.total).toBe(20);
    expect(r.totalPages).toBeGreaterThan(0);
  });
});

describe("mapVehiclesPage — respuestas rotas del backend", () => {
  it("una respuesta vacía o nula no explota: devuelve una página vacía", () => {
    for (const entrada of [null, undefined, {}, { allPhotos: null }]) {
      const r = mapVehiclesPage(entrada);
      expect(Array.isArray(r.vehicles)).toBe(true);
      expect(r.vehicles).toHaveLength(0);
    }
  });

  it("sin docs devuelve lista vacía y total 0", () => {
    const r = mapVehiclesPage({ allPhotos: { totalDocs: 0 } });
    expect(r.vehicles).toEqual([]);
    expect(r.total).toBe(0);
  });
});

describe("mapVehicle — detalle", () => {
  it("mapea un vehículo individual conservando sus campos", () => {
    const v = mapVehicle({ _id: "abc", marca: "Honda", modelo: "308", precio: 5000000 });
    expect(v).toMatchObject({ id: "abc", marca: "Honda", modelo: "308", precio: 5000000 });
  });

  it("devuelve null ante una entrada inválida", () => {
    for (const entrada of [null, undefined, "texto", 42]) {
      expect(mapVehicle(entrada)).toBeNull();
    }
  });

  it("extrae las imágenes del detalle", () => {
    const v = mapVehicle({ _id: "a", fotoPrincipal: FOTO, fotoHover: HOVER });
    expect(v.fotoPrincipal).toBe(FOTO.url);
    expect(Array.isArray(v["imágenes"])).toBe(true);
  });
});
