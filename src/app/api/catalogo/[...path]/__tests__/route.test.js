/**
 * Contrato de /api/catalogo: el proxy de LECTURA del catálogo para el navegador.
 *
 * - Solo GET y solo dos rutas: photos/getallphotos y photos/getonephoto/<24 hex>.
 *   Cualquier otra cosa da 404 sin tocar el backend (no es un proxy abierto).
 * - No agrega caché propio (no-store) ni reenvía credenciales: son datos públicos.
 * - Es transparente: status, cuerpo y Content-Type del backend, tal cual. La
 *   interpretación (qué es un error, qué se muestra) es del cliente.
 * - Si el backend no responde: 504 por timeout, 502 por red. Mensaje genérico,
 *   sin la URL del backend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as route from "../route";

const BACKEND = "http://backend.test";
const ID = "6ab26f0973c7ebf8ffbe4285";
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

function pedir(path, { query = "", headers = {} } = {}) {
  const request = new Request(`http://localhost/api/catalogo/${path.join("/")}${query}`, {
    headers,
  });
  return route.GET(request, { params: Promise.resolve({ path }) });
}

function backendResponde(cuerpo, { status = 200, contentType = "application/json" } = {}) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(cuerpo, { status, headers: { "content-type": contentType } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = BACKEND;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("/api/catalogo: qué deja pasar", () => {
  it("solo expone GET", () => {
    for (const metodo of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(route[metodo]).toBeUndefined();
    }
  });

  it.each([
    ["borrar un auto", ["photos", "deletephoto", ID]],
    ["login", ["user", "loginuser"]],
    ["id de ficha inválido", ["photos", "getonephoto", "abc"]],
    ["algo después del listado", ["photos", "getallphotos", "extra"]],
    ["intento de salir de la ruta", ["photos", "..", "user", "loginuser"]],
  ])("rechaza con 404 y sin tocar el backend: %s", async (_caso, path) => {
    const fetchMock = backendResponde("{}");

    const res = await pedir(path);

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reenvía el listado con la query tal cual, sin caché y sin credenciales", async () => {
    const fetchMock = backendResponde('{"allPhotos":{"docs":[]}}');

    await pedir(["photos", "getallphotos"], {
      query: "?marca=Peugeot&limit=8&cursor=2",
      headers: { authorization: "Bearer secreto", cookie: "sesion=1" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND}/photos/getallphotos?marca=Peugeot&limit=8&cursor=2`);
    expect(opciones.cache).toBe("no-store");
    expect(opciones.method ?? "GET").toBe("GET");
    expect(opciones.headers).toEqual({ Accept: "application/json" });
  });

  it("reenvía una ficha válida", async () => {
    const fetchMock = backendResponde('{"getOnePhoto":{}}');

    await pedir(["photos", "getonephoto", ID]);

    expect(fetchMock.mock.calls[0][0]).toBe(`${BACKEND}/photos/getonephoto/${ID}`);
  });
});

describe("/api/catalogo: transparencia", () => {
  it.each([
    [200, '{"allPhotos":{"docs":[]}}'],
    [404, '{"error":true,"msg":"Auto no encontrado"}'],
    [500, '{"error":true,"msg":"boom"}'],
  ])("devuelve el status %i y el cuerpo del backend tal cual", async (status, cuerpo) => {
    backendResponde(cuerpo, { status });

    const res = await pedir(["photos", "getallphotos"]);

    expect(res.status).toBe(status);
    expect(await res.text()).toBe(cuerpo);
    expect(res.headers.get("content-type")).toBe("application/json");
  });

  it("respeta un Content-Type que no es JSON (p. ej. una página de error del CDN)", async () => {
    backendResponde("<html>502</html>", { status: 502, contentType: "text/html" });

    const res = await pedir(["photos", "getallphotos"]);

    expect(res.status).toBe(502);
    expect(res.headers.get("content-type")).toBe("text/html");
  });
});

describe("/api/catalogo: nada se guarda en el navegador ni en el CDN", () => {
  it.each([
    ["respuesta del backend", () => { backendResponde("{}"); return pedir(["photos", "getallphotos"]); }],
    ["ruta rechazada", () => pedir(["user", "loginuser"])],
    ["red caída", () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
      return pedir(["photos", "getallphotos"]);
    }],
  ])("declara Cache-Control: no-store (%s)", async (_caso, hacer) => {
    const res = await hacer();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("/api/catalogo: el backend no responde", () => {
  it("timeout → 504 con mensaje genérico", async () => {
    const timeout = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));

    const res = await pedir(["photos", "getallphotos"]);
    const cuerpo = await res.text();

    expect(res.status).toBe(504);
    expect(cuerpo).not.toContain(BACKEND);
  });

  it("red caída → 502 con mensaje genérico", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const res = await pedir(["photos", "getallphotos"]);
    const cuerpo = await res.text();

    expect(res.status).toBe(502);
    expect(cuerpo).not.toContain(BACKEND);
    expect(cuerpo).not.toContain("fetch failed");
  });
});
