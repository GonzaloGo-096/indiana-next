/**
 * Test de integración del handler POST de /api/photos/create.
 *
 * Qué verifica (no la lógica de Sharp ni del backend, sino el contrato del handler):
 *   - El handler responde con el status y body que devuelve el backend (proxy correcto).
 *   - El header Authorization se reenvía al backend.
 *   - Si NO hay Authorization, responde 401 y NO llama al backend ni procesa el
 *     body. Es la vulnerabilidad crítica que detectó el relevamiento: antes se
 *     corría Sharp sobre el archivo entrante y recién después se miraba el
 *     header, así que un anónimo podía hacer trabajar al servidor.
 *   - En producción sin API_DEBUG, los `console.log` (debug/info) quedan silenciados.
 *   - En producción con API_DEBUG=true, los `console.log` vuelven a aparecer.
 *   - En desarrollo, los `console.log` siempre se emiten.
 *
 * Estrategia:
 *   - Se mockea `global.fetch` para no llamar al backend real.
 *   - Se construye un Request con FormData mínimo (sin archivos reales, así no
 *     ejecutamos Sharp en el test — Sharp ya tiene su propio camino de error
 *     cubierto y no es lo que estamos validando acá).
 *   - Se espía `console.log` / `console.warn` / `console.error` y se cuentan llamadas.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalNodeEnv = process.env.NODE_ENV;
const originalApiDebug = process.env.API_DEBUG;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

function buildRequest({ withAuth = true, authHeader = null, fields = {} } = {}) {
  const formData = new FormData();
  // Campos de texto solamente, así evitamos pasar por Sharp.
  formData.append("marca", "Peugeot");
  formData.append("modelo", "208");
  formData.append("precio", "12000000");
  formData.append("anio", "2024");
  formData.append("caja", "Manual");
  formData.append("kilometraje", "0");
  for (const [k, v] of Object.entries(fields)) formData.append(k, v);

  const headers = new Headers();
  if (authHeader) headers.set("Authorization", authHeader);
  else if (withAuth) headers.set("Authorization", "Bearer test-token-123");

  return new Request("http://localhost/api/photos/create", {
    method: "POST",
    headers,
    body: formData,
  });
}

function mockBackend({ status = 200, body = '{"ok":true}', contentType = "application/json" } = {}) {
  const response = new Response(body, {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "content-type": contentType },
  });
  return vi.fn().mockResolvedValue(response);
}

describe("POST /api/photos/create — integración", () => {
  let logSpy;
  let warnSpy;
  let errorSpy;
  let POST;

  beforeEach(async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://backend.test";
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Importar el handler fresco cada test (por si NODE_ENV se mutó).
    vi.resetModules();
    ({ POST } = await import("../route.js"));
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalApiDebug === undefined) delete process.env.API_DEBUG;
    else process.env.API_DEBUG = originalApiDebug;
    if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    vi.unstubAllGlobals();
  });

  describe("proxy hacia el backend", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      delete process.env.API_DEBUG;
    });

    it("reenvía status y body del backend tal cual", async () => {
      const fetchMock = mockBackend({ status: 201, body: '{"id":"abc"}' });
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(buildRequest());

      expect(res.status).toBe(201);
      expect(await res.text()).toBe('{"id":"abc"}');
    });

    it("reenvía el header Authorization al backend", async () => {
      const fetchMock = mockBackend();
      vi.stubGlobal("fetch", fetchMock);

      await POST(buildRequest({ withAuth: true }));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("http://backend.test/photos/create");
      expect(init.headers.get("Authorization")).toBe("Bearer test-token-123");
    });

    it("propaga 400 del backend con el body original", async () => {
      const fetchMock = mockBackend({ status: 400, body: '{"error":"bad"}' });
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(buildRequest());

      expect(res.status).toBe(400);
      expect(await res.text()).toBe('{"error":"bad"}');
      // El handler debe loggear el 400 como error (siempre visible).
      expect(errorSpy).toHaveBeenCalled();
    });

    it("devuelve 500 si fetch lanza", async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(buildRequest());

      expect(res.status).toBe(500);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("logging — gateo por entorno", () => {
    it("en producción SIN API_DEBUG: no emite console.log", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.API_DEBUG;
      vi.stubGlobal("fetch", mockBackend());

      await POST(buildRequest());

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("en producción CON API_DEBUG=true: vuelve a emitir console.log", async () => {
      process.env.NODE_ENV = "production";
      process.env.API_DEBUG = "true";
      vi.stubGlobal("fetch", mockBackend());

      await POST(buildRequest());

      expect(logSpy).toHaveBeenCalled();
    });

    it("en desarrollo: siempre emite console.log", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.API_DEBUG;
      vi.stubGlobal("fetch", mockBackend());

      await POST(buildRequest());

      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("portero: rechaza antes de gastar servidor", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
      delete process.env.API_DEBUG;
    });

    it("sin Authorization responde 401", async () => {
      vi.stubGlobal("fetch", mockBackend());

      const res = await POST(buildRequest({ withAuth: false }));

      expect(res.status).toBe(401);
    });

    it("sin Authorization NO llama al backend (no se gasta trabajo)", async () => {
      const fetchMock = mockBackend();
      vi.stubGlobal("fetch", fetchMock);

      await POST(buildRequest({ withAuth: false }));

      // El punto del arreglo: el rechazo ocurre antes de leer el body y antes
      // de reenviar nada. Si esto falla, volvió la vulnerabilidad.
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("con un Authorization que no es Bearer responde 401", async () => {
      const fetchMock = mockBackend();
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(buildRequest({ authHeader: "Basic dXNlcjpwYXNz" }));

      expect(res.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("con un Bearer vacío responde 401", async () => {
      const fetchMock = mockBackend();
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(buildRequest({ authHeader: "Bearer    " }));

      expect(res.status).toBe(401);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("deja pasar un Bearer válido", async () => {
      const fetchMock = mockBackend();
      vi.stubGlobal("fetch", fetchMock);

      const res = await POST(buildRequest({ withAuth: true }));

      expect(res.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("rechaza con 413 un payload que supera el máximo declarado", async () => {
      const fetchMock = mockBackend();
      vi.stubGlobal("fetch", fetchMock);

      const { MAX_UPLOAD_BYTES } = await import("@/lib/photos/uploadPipeline");
      const req = buildRequest({ withAuth: true });
      // Se fuerza el content-length declarado: interesa el corte por cabecera,
      // no mover de verdad 100 MB en un test.
      Object.defineProperty(req.headers, "get", {
        value: (name) =>
          name.toLowerCase() === "content-length"
            ? String(MAX_UPLOAD_BYTES + 1)
            : Headers.prototype.get.call(req.headers, name),
      });

      const res = await POST(req);

      expect(res.status).toBe(413);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
