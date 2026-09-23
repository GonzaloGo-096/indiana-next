/**
 * @vitest-environment jsdom
 *
 * Tests del listado de usados.
 *
 * Es la pieza con más decisiones del listado y donde vive el tipo de error que
 * no se ve: pedidos que se cruzan, la lista que se vacía sola, el orden que se
 * rompe al cargar más.
 *
 * El bug que originó toda esta línea de trabajo —el listado que desaparecía al
 * filtrar— era exactamente de esta familia. Nada de esto lo detecta el smoke:
 * la página responde 200 y se ve bien.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => {
  const router = { push: vi.fn(), replace: vi.fn() };
  return {
    router,
    searchParams: new URLSearchParams(""),
    getVehicles: vi.fn(),
    pushDataLayer: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => m.router,
  useSearchParams: () => m.searchParams,
}));

vi.mock("@/lib/services/vehiclesApi", () => ({
  vehiclesService: { getVehicles: (...a) => m.getVehicles(...a) },
}));

vi.mock("@/lib/analytics/dataLayer", () => ({
  pushDataLayer: (...a) => m.pushDataLayer(...a),
}));

// El mapeo del backend ya tiene sus propios tests. Acá se deja pasar tal cual
// para controlar exactamente la forma de los datos y aislar lo que se prueba.
vi.mock("@/lib/mappers/vehicleMapper", () => ({
  mapVehiclesPage: (datos) => datos,
}));

vi.mock("../useScrollRestore", () => ({ useScrollRestore: () => {} }));

const { useVehiclesList } = await import("@/app/(site)/usados/vehiculos/useVehiclesList");
const { LIST_ERROR_MESSAGE, VEHICLE_CONSTANTS } = await import("@/constants/vehicles");

/** Una página de resultados con la forma que devuelve el mapeo. */
function pagina(ids, { hasNextPage = false, nextPage = null, total = ids.length } = {}) {
  return {
    vehicles: ids.map((id) => ({ id, marca: "Peugeot", modelo: String(id) })),
    total,
    hasNextPage,
    nextPage,
    currentCursor: 1,
    totalPages: 1,
  };
}

const VACIO = { vehicles: [], total: 0, hasNextPage: false, nextPage: null };

function montar(inicial = VACIO, error = null) {
  return renderHook(() => useVehiclesList({ initialData: inicial, initialError: error }));
}

beforeEach(() => {
  m.router.push.mockClear();
  m.router.replace.mockClear();
  m.getVehicles.mockReset();
  m.pushDataLayer.mockClear();
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("arranque", () => {
  it("parte de los datos que trajo el servidor, sin volver a pedirlos", () => {
    const { result } = montar(pagina([1, 2, 3]));
    expect(result.current.data.vehicles).toHaveLength(3);
    expect(result.current.isLoading).toBe(false);
    expect(m.getVehicles).not.toHaveBeenCalled();
  });

  it("respeta un error que ya venía del servidor", () => {
    const { result } = montar(VACIO, "El backend no respondió");
    expect(result.current.error).toBe("El backend no respondió");
  });
});

// El listado llega completo y se pagina en pantalla: así los vendidos pueden
// quedar al final de TODO el listado (el backend no ordena por estado).
describe("cargar más", () => {
  const muchos = (n) => pagina(Array.from({ length: n }, (_, i) => i + 1));
  const visibles = (result) => result.current.sortedVehicles.map((v) => v.id);

  it("muestra de a 8 y cargar más suma 8, sin pedirle nada al backend", () => {
    const { result } = montar(muchos(20));
    expect(visibles(result)).toHaveLength(8);
    expect(result.current.data.hasNextPage).toBe(true);

    act(() => result.current.loadMore());

    expect(visibles(result)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    expect(m.getVehicles).not.toHaveBeenCalled();
  });

  it("al llegar al final no hay más para cargar y cargar más no hace nada", () => {
    const { result } = montar(muchos(10));

    act(() => result.current.loadMore());
    expect(visibles(result)).toHaveLength(10);
    expect(result.current.data.hasNextPage).toBe(false);

    act(() => result.current.loadMore());
    expect(visibles(result)).toHaveLength(10);
  });

  it("con 8 autos o menos no ofrece cargar más", () => {
    const { result } = montar(muchos(5));
    expect(result.current.data.hasNextPage).toBe(false);
  });

  it("al filtrar vuelve a mostrar de a 8", async () => {
    const { result } = montar(muchos(20));
    act(() => result.current.loadMore());
    m.getVehicles.mockResolvedValue(muchos(12));

    await act(async () => {
      await result.current.applyFilters({ marca: ["Peugeot"] });
    });

    expect(visibles(result)).toHaveLength(8);
    expect(result.current.data.hasNextPage).toBe(true);
  });

  it("respeta cuántos se veían si la lista vuelve restaurada (volver de una ficha)", () => {
    const { result } = montar({ ...muchos(20), visibleCount: 16 });
    expect(visibles(result)).toHaveLength(16);
  });
});

describe("aplicar filtros", () => {
  it("pide TODOS los resultados del filtro en un pedido y reemplaza la lista", async () => {
    m.getVehicles.mockResolvedValue(pagina([7], { total: 1 }));
    const { result } = montar(pagina([1, 2, 3]));

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    expect(m.getVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: 1,
        limit: VEHICLE_CONSTANTS.LIST_FETCH_LIMIT,
        filters: { marca: ["Toyota"] },
      }),
    );
    expect(result.current.data.vehicles.map((v) => v.id)).toEqual([7]);
  });

  it("un fallo real muestra el mensaje fijo, nunca el técnico", async () => {
    m.getVehicles.mockRejectedValue(new Error("Request failed with status code 502"));
    const { result } = montar();

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    expect(result.current.error).toBe(LIST_ERROR_MESSAGE);
    expect(result.current.error).not.toMatch(/502|Request failed/);
    expect(result.current.isLoading).toBe(false);
  });

  it("un pedido cancelado NO se muestra como error", async () => {
    // Cancelar es lo que pasa cada vez que el usuario cambia de filtro rápido.
    // Si esto se tratara como error, filtrar seguido llenaría la pantalla de
    // avisos falsos.
    const cancelado = new Error("canceled");
    cancelado.name = "AbortError";
    m.getVehicles.mockRejectedValue(cancelado);

    const { result } = montar(pagina([1]));
    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data.vehicles).toHaveLength(1);
  });

  it("filtrar dos veces seguidas cancela el pedido anterior", async () => {
    const señales = [];
    m.getVehicles.mockImplementation(({ signal }) => {
      señales.push(signal);
      return new Promise(() => {}); // nunca resuelve: queda en vuelo
    });

    const { result } = montar();

    await act(async () => {
      result.current.applyFilters({ marca: ["Toyota"] });
    });
    await act(async () => {
      result.current.applyFilters({ marca: ["Honda"] });
    });

    expect(señales).toHaveLength(2);
    expect(señales[0].aborted).toBe(true);
    expect(señales[1].aborted).toBe(false);
  });

  it("marca que está cargando mientras el pedido viaja", async () => {
    let resolver;
    m.getVehicles.mockReturnValue(new Promise((r) => { resolver = r; }));

    const { result } = montar();
    await act(async () => {
      result.current.applyFilters({ marca: ["Toyota"] });
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolver(pagina([1]));
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("limpia el error anterior al volver a filtrar", async () => {
    m.getVehicles.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = montar();

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });
    expect(result.current.error).toBe(LIST_ERROR_MESSAGE);

    m.getVehicles.mockResolvedValue(pagina([1]));
    await act(async () => {
      await result.current.applyFilters({ marca: ["Honda"] });
    });
    expect(result.current.error).toBeNull();
  });

  it("actualiza la dirección de la página para poder compartirla", async () => {
    m.getVehicles.mockResolvedValue(pagina([1]));
    const { result } = montar();

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    const destino = m.router.push.mock.calls.at(-1)?.[0] || m.router.replace.mock.calls.at(-1)?.[0];
    expect(destino).toBeTruthy();
    expect(String(destino)).toContain("Toyota");
  });
});

describe("medición", () => {
  it("informa cuántos resultados dio el filtro", async () => {
    m.getVehicles.mockResolvedValue(pagina([1, 2], { total: 2 }));
    const { result } = montar();

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    const evento = m.pushDataLayer.mock.calls.find(([nombre]) => /filter/i.test(nombre));
    expect(evento?.[1]).toMatchObject({ results_count: 2 });
  });

  it("limpiar todos los filtros no cuenta como una búsqueda", async () => {
    m.getVehicles.mockResolvedValue(pagina([1, 2, 3]));
    const { result } = montar();

    await act(async () => {
      await result.current.applyFilters({});
    });

    const busqueda = m.pushDataLayer.mock.calls.find(([n]) => /search/i.test(n));
    expect(busqueda).toBeUndefined();
  });
});

// Decisión de producto (2026-09-23): los vendidos se ven solo en el listado y
// siempre al final, también con filtros y con cualquier orden elegido.
describe("vendidos al final", () => {
  const auto = (id, { estado, precio = 1000 } = {}) => ({
    id,
    marca: "Peugeot",
    modelo: String(id),
    precio,
    ...(estado ? { estado } : {}),
  });
  const conAutos = (vehicles, extra = {}) => ({ ...pagina([]), vehicles, total: vehicles.length, ...extra });
  const orden = (result) => result.current.sortedVehicles.map((v) => v.id);

  afterEach(() => {
    m.searchParams = new URLSearchParams("");
  });

  it("sin orden elegido, los vendidos quedan después de los disponibles", () => {
    const { result } = montar(conAutos([auto(1, { estado: "VENDIDO" }), auto(2), auto(3)]));

    expect(orden(result)).toEqual([2, 3, 1]);
  });

  it("con un orden elegido, el vendido sigue al final aunque sea el más barato", () => {
    m.searchParams = new URLSearchParams("sort=precio_asc");
    const { result } = montar(
      conAutos([
        auto(1, { precio: 3000 }),
        auto(2, { estado: "VENDIDO", precio: 100 }),
        auto(3, { precio: 2000 }),
      ]),
    );

    expect(orden(result)).toEqual([3, 1, 2]);
  });

  it("un vendido que el backend trae entre los primeros aparece al final de TODO el listado", () => {
    // 10 autos; el 1 (el más nuevo) está vendido. En la primera tanda de 8 no
    // aparece: se ve recién cuando se cargó todo, en el último lugar.
    const autos = [auto(1, { estado: "VENDIDO" }), ...[2, 3, 4, 5, 6, 7, 8, 9, 10].map((id) => auto(id))];
    const { result } = montar(conAutos(autos));

    expect(orden(result)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);

    act(() => result.current.loadMore());

    expect(orden(result)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 1]);
  });

  it("al filtrar, el resultado también deja los vendidos al final", async () => {
    const { result } = montar(conAutos([auto(1)]));
    m.getVehicles.mockResolvedValue(conAutos([auto(7, { estado: "VENDIDO" }), auto(8)]));

    await act(async () => {
      await result.current.applyFilters({ marca: ["Peugeot"] });
    });

    expect(orden(result)).toEqual([8, 7]);
  });
});
