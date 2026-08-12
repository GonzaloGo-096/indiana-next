/**
 * @vitest-environment jsdom
 *
 * Tests del listado de usados.
 *
 * 495 líneas con cuatro estados, seis referencias vivas entre renders y tres
 * efectos. Es la pieza con más decisiones del proyecto y donde vive el tipo de
 * error que no se ve: pedidos que se cruzan, un botón que dispara dos veces,
 * la lista que se vacía sola.
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

describe("cargar más", () => {
  it("agrega los autos nuevos a los que ya estaban", async () => {
    m.getVehicles.mockResolvedValue(pagina([3, 4]));
    const { result } = montar(pagina([1, 2], { hasNextPage: true, nextPage: 2, total: 4 }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.data.vehicles.map((v) => v.id)).toEqual([1, 2, 3, 4]);
  });

  it("no duplica un auto que ya estaba en pantalla", async () => {
    // Pasa cuando el backend reordena entre una página y la siguiente.
    m.getVehicles.mockResolvedValue(pagina([2, 3]));
    const { result } = montar(pagina([1, 2], { hasNextPage: true, nextPage: 2 }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.data.vehicles.map((v) => v.id)).toEqual([1, 2, 3]);
  });

  it("dos toques seguidos hacen UN solo pedido", async () => {
    // El candado existe justo para esto: sin él se cargaba dos veces la misma
    // página y aparecían autos repetidos.
    let resolver;
    m.getVehicles.mockReturnValue(new Promise((r) => { resolver = r; }));

    const { result } = montar(pagina([1], { hasNextPage: true, nextPage: 2 }));

    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
      resolver(pagina([2]));
    });

    expect(m.getVehicles).toHaveBeenCalledTimes(1);
  });

  it("no pide nada si no hay página siguiente", async () => {
    const { result } = montar(pagina([1, 2], { hasNextPage: false }));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(m.getVehicles).not.toHaveBeenCalled();
  });

  it("no pide nada si dice que hay siguiente pero no dice cuál", async () => {
    const { result } = montar(pagina([1], { hasNextPage: true, nextPage: null }));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(m.getVehicles).not.toHaveBeenCalled();
  });

  it("si falla, NO borra los autos que ya se veían", async () => {
    m.getVehicles.mockRejectedValue(new Error("Network Error"));
    const { result } = montar(pagina([1, 2], { hasNextPage: true, nextPage: 2 }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.error).toBe("Network Error");
    expect(result.current.data.vehicles).toHaveLength(2);
  });

  it("después de fallar se puede reintentar: el candado se libera", async () => {
    m.getVehicles.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = montar(pagina([1], { hasNextPage: true, nextPage: 2 }));

    await act(async () => {
      await result.current.loadMore();
    });

    m.getVehicles.mockResolvedValue(pagina([2]));
    await act(async () => {
      await result.current.loadMore();
    });

    expect(m.getVehicles).toHaveBeenCalledTimes(2);
    expect(result.current.data.vehicles.map((v) => v.id)).toEqual([1, 2]);
  });
});

describe("aplicar filtros", () => {
  it("pide los resultados desde la primera página y reemplaza la lista", async () => {
    m.getVehicles.mockResolvedValue(pagina([7], { total: 1 }));
    const { result } = montar(pagina([1, 2, 3]));

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    expect(m.getVehicles).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 1, filters: { marca: ["Toyota"] } }),
    );
    expect(result.current.data.vehicles.map((v) => v.id)).toEqual([7]);
  });

  it("un fallo real deja el mensaje de error", async () => {
    m.getVehicles.mockRejectedValue(new Error("Network Error"));
    const { result } = montar();

    await act(async () => {
      await result.current.applyFilters({ marca: ["Toyota"] });
    });

    expect(result.current.error).toBe("Network Error");
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
    expect(result.current.error).toBe("Network Error");

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
