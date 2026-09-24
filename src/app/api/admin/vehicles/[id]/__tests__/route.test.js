/**
 * Contrato de /api/admin/vehicles/[id]: reenvío al backend de las operaciones
 * del panel sobre un auto (borrar y cambiar estado).
 *
 * - Sin credencial o con un id mal formado no se llama al backend.
 * - El estado se valida acá contra los tres que conoce el backend.
 * - Un 404 que no es JSON es "el backend no tiene esta operación" (501), no
 *   "auto no encontrado": pasa con el backend de producción antes de que
 *   publiquen los estados.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DELETE, PATCH } from "../route";

const BACKEND = "http://backend.test";
const ID = "6ab26f0973c7ebf8ffbe4285";
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

function backendResponde(cuerpo, { status = 200, contentType = "application/json" } = {}) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(cuerpo, { status, headers: { "content-type": contentType } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function patch(body, { id = ID, token = "tkn" } = {}) {
  const request = new Request(`http://localhost/api/admin/vehicles/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return PATCH(request, { params: Promise.resolve({ id }) });
}

function del({ id = ID, token = "tkn" } = {}) {
  const request = new Request(`http://localhost/api/admin/vehicles/${id}`, {
    method: "DELETE",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return DELETE(request, { params: Promise.resolve({ id }) });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = BACKEND;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PATCH: cambiar estado", () => {
  it("reenvía al backend con la credencial y el estado, y devuelve su respuesta", async () => {
    const cuerpo = JSON.stringify({ error: null, msg: "Estado del auto actualizado correctamente" });
    const fetchMock = backendResponde(cuerpo);

    const res = await patch({ estado: "VENDIDO" });

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(cuerpo);
    expect(res.headers.get("cache-control")).toBe("no-store");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND}/photos/updatestatus/${ID}`);
    expect(init.method).toBe("PATCH");
    expect(init.headers.Authorization).toBe("Bearer tkn");
    expect(JSON.parse(init.body)).toEqual({ estado: "VENDIDO" });
  });

  it.each([
    ["un estado desconocido", { estado: "RESERVADO" }],
    ["minúsculas", { estado: "vendido" }],
    ["sin estado", {}],
    ["cuerpo que no es JSON", "no-json"],
  ])("rechaza %s sin llamar al backend", async (_caso, body) => {
    const fetchMock = backendResponde("{}");
    const res = await patch(body);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sin credencial: 401 sin llamar al backend", async () => {
    const fetchMock = backendResponde("{}");
    expect((await patch({ estado: "VENDIDO" }, { token: "" })).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("id mal formado: 400 sin llamar al backend", async () => {
    const fetchMock = backendResponde("{}");
    expect((await patch({ estado: "VENDIDO" }, { id: "abc" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["backend de producción: { msg: 'Ruta no encontrada' }", JSON.stringify({ error: true, msg: "Ruta no encontrada" }), "application/json; charset=utf-8"],
    ["Express sin manejador: página HTML", "<pre>Cannot PATCH /photos/updatestatus/x</pre>", "text/html"],
  ])("backend sin la operación (%s): 501 con mensaje claro", async (_caso, cuerpo, contentType) => {
    backendResponde(cuerpo, { status: 404, contentType });
    const res = await patch({ estado: "VENDIDO" });

    expect(res.status).toBe(501);
    expect((await res.json()).msg).toBe("El backend todavía no permite cambiar el estado de un auto.");
  });

  it("auto inexistente (404 JSON del backend): se devuelve tal cual", async () => {
    backendResponde(JSON.stringify({ error: true, msg: "Auto no encontrado" }), { status: 404 });
    const res = await patch({ estado: "VENDIDO" });

    expect(res.status).toBe(404);
    expect((await res.json()).msg).toBe("Auto no encontrado");
  });

  it("backend caído: 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect((await patch({ estado: "VENDIDO" })).status).toBe(502);
  });
});

describe("DELETE: sigue igual que antes", () => {
  it("reenvía al backend y devuelve su respuesta", async () => {
    const fetchMock = backendResponde(JSON.stringify({ error: null, msg: "ok" }));
    const res = await del();

    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND}/photos/deletephoto/${ID}`);
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
  });

  it("sin credencial o con id inválido no llama al backend", async () => {
    const fetchMock = backendResponde("{}");
    expect((await del({ token: "" })).status).toBe(401);
    expect((await del({ id: "x" })).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("timeout: 504", async () => {
    const timeout = Object.assign(new Error("t"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));
    expect((await del()).status).toBe(504);
  });
});
