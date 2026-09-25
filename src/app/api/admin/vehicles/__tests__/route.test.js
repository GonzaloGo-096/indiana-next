/**
 * Contrato de GET /api/admin/vehicles: la lista del panel.
 *
 * - Va a la lista PRIVADA del backend (incluye pausados), con la credencial.
 * - Solo pasan filtros y paginado; cualquier otro parámetro se descarta.
 * - Sin credencial no se llama al backend.
 * - Un backend sin la lista privada (desactualizado) da 501 con mensaje claro.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "../route";

const BACKEND = "http://backend.test";
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

function backendResponde(cuerpo, { status = 200, contentType = "application/json" } = {}) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(cuerpo, { status, headers: { "content-type": contentType } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function listar(query = "", { token = "tkn" } = {}) {
  return GET(
    new Request(`http://localhost/api/admin/vehicles${query}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = BACKEND;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/admin/vehicles", () => {
  it("pide la lista privada con la credencial y devuelve la respuesta tal cual, sin caché", async () => {
    const cuerpo = JSON.stringify({ error: null, allPhotos: { docs: [], totalDocs: 0 } });
    const fetchMock = backendResponde(cuerpo);

    const res = await listar("?limit=1000&cursor=1");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(cuerpo);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND}/photos/getallphotos/private?limit=1000&cursor=1`);
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer tkn");
  });

  it("pasa los filtros que el backend entiende y descarta el resto", async () => {
    const fetchMock = backendResponde("{}");

    await listar("?marca=Peugeot,Ford&caja=Manual&anio=2015,2024&estado=PAUSADO&url=http://otro&limit=5");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/photos/getallphotos/private");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      marca: "Peugeot,Ford",
      caja: "Manual",
      anio: "2015,2024",
      limit: "5",
    });
  });

  it("sin parámetros no deja un '?' colgando", async () => {
    const fetchMock = backendResponde("{}");
    await listar("");
    expect(fetchMock.mock.calls[0][0]).toBe(`${BACKEND}/photos/getallphotos/private`);
  });

  it("sin credencial: 401 sin llamar al backend", async () => {
    const fetchMock = backendResponde("{}");
    expect((await listar("", { token: "" })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("backend sin la lista privada: 501 con mensaje claro", async () => {
    backendResponde(JSON.stringify({ error: true, msg: "Ruta no encontrada" }), { status: 404 });
    const res = await listar();

    expect(res.status).toBe(501);
    expect((await res.json()).msg).toBe("El backend todavía no permite listar los autos del panel.");
  });

  it("credencial vencida: el 401 del backend se devuelve tal cual (el panel cierra sesión)", async () => {
    backendResponde(JSON.stringify({ error: true, msg: "token missing or invalid" }), { status: 401 });
    expect((await listar()).status).toBe(401);
  });
});
