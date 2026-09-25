/**
 * Contrato del listado ante fallas del backend (render del servidor).
 *
 * - Una falla, sea cual sea (incluido un 404 del backend), NO es notFound():
 *   /usados/vehiculos existe aunque el backend falle, y un 404 con noindex
 *   la sacaría de Google.
 * - El visitante ve solo LIST_ERROR_MESSAGE: ni el mensaje técnico ni nombres
 *   de variables de entorno.
 * - Una lista vacía de verdad no es un error.
 *
 * Se mockea el servicio y se usa el mapper real (es el que decide si una
 * respuesta rota es un error).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({ getVehicles: vi.fn() }));

vi.mock("@/lib/services/vehiclesApi.server", () => ({
  vehiclesService: { getVehicles: (...a) => m.getVehicles(...a) },
}));

function VehiculosClientFalso() {
  return null;
}
vi.mock("../VehiculosClient", () => ({ default: VehiculosClientFalso }));

const { default: VehiculosPage } = await import("../page");
const { LIST_ERROR_MESSAGE } = await import("@/constants/vehicles");

const props = { searchParams: Promise.resolve({}) };

/** Props con las que la página monta VehiculosClient (busca en el árbol). */
function propsDelCliente(elemento) {
  if (!elemento || typeof elemento !== "object") return null;
  if (elemento.type === VehiculosClientFalso) return elemento.props;
  const hijos = [].concat(elemento.props?.children ?? []);
  for (const hijo of hijos) {
    const encontrado = propsDelCliente(hijo);
    if (encontrado) return encontrado;
  }
  return null;
}

beforeEach(() => {
  m.getVehicles.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("listado: una falla del backend", () => {
  it.each([
    ["500", new Error("API error: 500 Internal Server Error")],
    ["404 del backend", new Error("API error: 404 Not Found")],
    ["red caída", new TypeError("fetch failed")],
    ["timeout", new Error("Request timeout: 15000ms")],
  ])("(%s) muestra el error fijo, sin notFound ni detalles internos", async (_caso, falla) => {
    m.getVehicles.mockRejectedValue(falla);

    const cliente = propsDelCliente(await VehiculosPage(props));

    expect(cliente.error).toBe(LIST_ERROR_MESSAGE);
    expect(cliente.error).not.toMatch(/API error|fetch failed|NEXT_PUBLIC|backend/i);
    expect(cliente.initialData.vehicles).toEqual([]);
  });

  it("una respuesta rota (sin allPhotos) es un error, no 'No se encontraron vehículos'", async () => {
    m.getVehicles.mockResolvedValue({ error: null });

    const cliente = propsDelCliente(await VehiculosPage(props));

    expect(cliente.error).toBe(LIST_ERROR_MESSAGE);
  });
});

describe("listado: respuestas válidas", () => {
  it("una lista vacía de verdad no es un error", async () => {
    m.getVehicles.mockResolvedValue({ allPhotos: { docs: [], totalDocs: 0 } });

    const cliente = propsDelCliente(await VehiculosPage(props));

    expect(cliente.error ?? null).toBeNull();
    expect(cliente.initialData.vehicles).toEqual([]);
  });

  it("con autos, los pasa al cliente sin error", async () => {
    m.getVehicles.mockResolvedValue({
      allPhotos: { docs: [{ _id: "a", marca: "Peugeot", modelo: "208" }], totalDocs: 1 },
    });

    const cliente = propsDelCliente(await VehiculosPage(props));

    expect(cliente.error ?? null).toBeNull();
    expect(cliente.initialData.vehicles.map((v) => v.id)).toEqual(["a"]);
  });
});
