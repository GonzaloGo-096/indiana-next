/**
 * @vitest-environment jsdom
 *
 * Cuándo y con qué sale view_search_results (auditoría QA del 2026-10-07): buildSearchEventParams directo (rangos, page/sort, marca vacía),
 * back/forward (sync de URL) y aterrizaje con query.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  searchParams: new URLSearchParams(""),
  getVehicles: vi.fn(),
  track: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => m.router, useSearchParams: () => m.searchParams }));
vi.mock("@/lib/services/vehiclesApi", () => ({ vehiclesService: { getVehicles: (...a) => m.getVehicles(...a) } }));
vi.mock("@/lib/analytics/dataLayer", () => ({ track: (...a) => m.track(...a) }));
vi.mock("@/lib/mappers/vehicleMapper", () => ({ mapVehiclesPage: (d) => d }));
vi.mock("@/app/(site)/usados/vehiculos/useScrollRestore", () => ({ useScrollRestore: () => {} }));

const { useVehiclesList, buildSearchEventParams } = await import("@/app/(site)/usados/vehiculos/useVehiclesList");
const { FILTER_DEFAULTS: D } = await import("@/constants/filterOptions");

beforeEach(() => {
  m.track.mockClear();
  m.getVehicles.mockReset();
  m.searchParams = new URLSearchParams("");
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

describe("buildSearchEventParams", () => {
  it("sin filtros: 0 filtros y sin marca", () => {
    expect(buildSearchEventParams({})).toEqual({ filters_count: 0, marca: undefined });
  });

  it("marca vacía no viaja como string vacío", () => {
    expect(buildSearchEventParams({ marca: [] }).marca).toBeUndefined();
  });

  it("un rango movido cuenta como UN filtro (precio min y max van juntos)", () => {
    expect(buildSearchEventParams({ precio: [D.PRECIO.min + 1, D.PRECIO.max] }).filters_count).toBe(1);
  });

  it("los tres rangos movidos + marca + caja + combustible = 6", () => {
    expect(
      buildSearchEventParams({
        marca: ["Ford"],
        caja: ["Manual"],
        combustible: ["Nafta"],
        año: [D.AÑO.min + 1, D.AÑO.max],
        precio: [D.PRECIO.min, D.PRECIO.max - 1],
        kilometraje: [D.KILOMETRAJE.min, D.KILOMETRAJE.max - 1],
      }).filters_count,
    ).toBe(6);
  });

  it("page no cuenta como filtro", () => {
    expect(buildSearchEventParams({ marca: ["Ford"], page: 3 }).filters_count).toBe(1);
  });

  it("varias marcas viajan juntas y en orden", () => {
    expect(buildSearchEventParams({ marca: ["Peugeot", "Citroën"] }).marca).toBe("Peugeot,Citroën");
  });

  it("cambiar de página no es una búsqueda (antes salía una con 0 filtros)", async () => {
    m.getVehicles.mockResolvedValue({ vehicles: [], total: 0 });
    const { result } = renderHook(() => useVehiclesList({ initialData: { vehicles: [], total: 0 } }));
    await act(async () => {
      await result.current.applyFilters({ page: 2 });
    });
    expect(m.track).not.toHaveBeenCalledWith("view_search_results", expect.anything());
  });
});

describe("cuándo se manda view_search_results", () => {
  it("aterrizar con filtros en la URL NO manda búsqueda (lo trae el servidor)", () => {
    m.searchParams = new URLSearchParams("marca=Ford");
    renderHook(() => useVehiclesList({ initialData: { vehicles: [], total: 0 } }));
    expect(m.track).not.toHaveBeenCalled();
  });

  it("back/forward a otro filtro manda UNA búsqueda con los filtros de la URL", async () => {
    m.getVehicles.mockResolvedValue({ vehicles: [{ id: 1 }], total: 1 });
    const { rerender } = renderHook(() => useVehiclesList({ initialData: { vehicles: [], total: 0 } }));
    m.searchParams = new URLSearchParams("marca=Toyota");
    rerender();
    await waitFor(() => expect(m.track).toHaveBeenCalledTimes(1));
    expect(m.track).toHaveBeenCalledWith("view_search_results", { results_count: 1, filters_count: 1, marca: "Toyota" });
  });

  it("un pedido que falla no manda búsqueda", async () => {
    m.getVehicles.mockRejectedValue(new Error("502"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useVehiclesList({ initialData: { vehicles: [], total: 0 } }));
    await act(async () => {
      await result.current.applyFilters({ marca: ["Ford"] });
    });
    expect(m.track).not.toHaveBeenCalled();
  });

  it("dos filtros rápidos (el primero se cancela) mandan una sola búsqueda, la del segundo", async () => {
    let resolverPrimero;
    m.getVehicles
      .mockImplementationOnce(({ signal }) => new Promise((res, rej) => {
        resolverPrimero = res;
        signal.addEventListener("abort", () => rej(Object.assign(new Error("canceled"), { name: "CanceledError" })));
      }))
      .mockResolvedValueOnce({ vehicles: [], total: 4 });
    const { result } = renderHook(() => useVehiclesList({ initialData: { vehicles: [], total: 0 } }));
    await act(async () => {
      result.current.applyFilters({ marca: ["Ford"] });
      await result.current.applyFilters({ marca: ["Fiat"] });
    });
    resolverPrimero?.({ vehicles: [], total: 99 });
    expect(m.track).toHaveBeenCalledTimes(1);
    expect(m.track.mock.calls[0][1]).toMatchObject({ marca: "Fiat", results_count: 4 });
  });
});
