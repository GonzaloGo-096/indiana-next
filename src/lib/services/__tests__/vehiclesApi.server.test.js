/**
 * El frontend no guarda datos de vehículos entre visitas: el caché es del backend.
 *
 * Con el Data Cache de Next (revalidate 21600 + tags) un auto borrado seguía
 * en el listado hasta 6 horas y su ficha terminaba en 404. Estos tests fallan
 * si alguien vuelve a poner `next.revalidate`, tags o `force-cache` en los
 * pedidos de vehículos.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { vehiclesService } from "../vehiclesApi.server";

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
const ID = "6ab26f0973c7ebf8ffbe4285";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function opcionesDelUnicoFetch() {
  expect(global.fetch).toHaveBeenCalledTimes(1);
  return global.fetch.mock.calls[0][1];
}

describe("vehiclesApi.server: sin caché de datos en el frontend", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://backend.test";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    vi.restoreAllMocks();
  });

  it("el listado se pide con no-store y sin revalidate ni tags", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ allPhotos: { docs: [] } }));

    await vehiclesService.getVehicles({ limit: 8, cursor: 1 });

    const opciones = opcionesDelUnicoFetch();
    expect(opciones.cache).toBe("no-store");
    expect(opciones.next).toBeUndefined();
  });

  it("la ficha se pide con no-store y sin revalidate ni tags", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ getOnePhoto: { _id: ID } }));

    const vehicle = await vehiclesService.getVehicleById(ID);

    expect(vehicle).toEqual({ _id: ID });
    const opciones = opcionesDelUnicoFetch();
    expect(opciones.cache).toBe("no-store");
    expect(opciones.next).toBeUndefined();
  });

  it("un auto borrado (404 del backend) devuelve null para que la ficha dé 404", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({ error: true, msg: "Auto no encontrado" }, 404),
    );

    await expect(vehiclesService.getVehicleById(ID)).resolves.toBeNull();
  });

  it("un auto inexistente respondido como 200 { getOnePhoto: null } también da null", async () => {
    // Así responde el backend del repo (y el de preview) cuando el id no existe.
    global.fetch.mockResolvedValue(jsonResponse({ error: null, getOnePhoto: null }));

    await expect(vehiclesService.getVehicleById(ID)).resolves.toBeNull();
  });

  it.each([
    ["cuerpo vacío", ""],
    ["JSON sin getOnePhoto", JSON.stringify({ error: null })],
    ["getOnePhoto que no es un objeto", JSON.stringify({ getOnePhoto: "texto" })],
    ["algo que no es JSON", "<html>502 Bad Gateway</html>"],
  ])("una respuesta inválida (%s) es un error, nunca null", async (_caso, cuerpo) => {
    global.fetch.mockResolvedValue(new Response(cuerpo, { status: 200 }));

    await expect(vehiclesService.getVehicleById(ID)).rejects.toThrow(
      "respuesta inválida",
    );
  });

  it("un error de red es un error, nunca null", async () => {
    global.fetch.mockRejectedValue(new TypeError("fetch failed"));

    await expect(vehiclesService.getVehicleById(ID)).rejects.toThrow("fetch failed");
  });

  it("otros errores del backend siguen siendo error, no 404", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ error: true }, 500));

    await expect(vehiclesService.getVehicleById(ID)).rejects.toThrow(
      "API error: 500",
    );
  });
});
