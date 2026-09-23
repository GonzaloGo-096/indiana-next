/**
 * @vitest-environment jsdom
 *
 * Decisión de producto (2026-09-23): los vendidos se ven solo en el listado de
 * usados. Nunca en carruseles, y el carrusel no se achica por sacarlos (se
 * piden de más y se recorta después).
 *
 * Se prueban dos carruseles representativos: el del inicio (servidor) y el de
 * similares de la ficha (navegador). Los de /usados y rango de precio usan la
 * misma regla (sinVendidos + pedir de más).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ serverGetVehicles: vi.fn(), clientGetVehicles: vi.fn() }));

vi.mock("@/lib/services/vehiclesApi.server", () => ({
  vehiclesService: { getVehicles: (...a) => m.serverGetVehicles(...a) },
}));
vi.mock("../../lib/services/vehiclesApi", () => ({
  vehiclesService: { getVehicles: (...a) => m.clientGetVehicles(...a) },
}));

function CarruselFalso() {
  return null;
}
vi.mock("@/components/home/HomeUsadosCarousel", () => ({ HomeUsadosCarousel: CarruselFalso }));

const { HomeUsadosCarouselServer } = await import("@/components/home/HomeUsadosCarouselServer");
const { useSimilarVehicles } = await import("../useSimilarVehicles");

/** Respuesta del backend: los ids pares están vendidos. */
function paginaDelBackend(cantidad) {
  const docs = Array.from({ length: cantidad }, (_, i) => ({
    _id: `a${i + 1}`,
    marca: "Peugeot",
    modelo: "208",
    ...((i + 1) % 2 === 0 ? { estado: "VENDIDO" } : {}),
  }));
  return { allPhotos: { docs, totalDocs: cantidad } };
}

beforeEach(() => {
  m.serverGetVehicles.mockReset();
  m.clientGetVehicles.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("carrusel del inicio", () => {
  it("no muestra vendidos y sigue mostrando 6 aunque la mitad esté vendida", async () => {
    m.serverGetVehicles.mockResolvedValue(paginaDelBackend(12));

    const elemento = await HomeUsadosCarouselServer();
    const autos = elemento.props.vehicles;

    expect(autos.some((a) => a.estado === "VENDIDO")).toBe(false);
    expect(autos).toHaveLength(6);
    expect(m.serverGetVehicles).toHaveBeenCalledWith(expect.objectContaining({ limit: 12 }));
  });
});

describe("carrusel de similares", () => {
  it("no sugiere vendidos ni el auto que se está viendo", async () => {
    m.clientGetVehicles.mockResolvedValue(paginaDelBackend(10));

    const { result } = renderHook(() =>
      useSimilarVehicles({ id: "a1", marca: "Peugeot" }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const ids = result.current.vehicles.map((v) => v.id);
    expect(ids).toEqual(["a3", "a5", "a7", "a9"]);
  });
});
