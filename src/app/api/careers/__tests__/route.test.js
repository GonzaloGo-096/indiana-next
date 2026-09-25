/**
 * Contrato de /api/careers: pasa la postulación al backend (POST /jobs/apply).
 *
 * Lo que se fija:
 * - { ok: true } SOLO si el backend confirmó el envío. Nunca antes.
 * - Backend sin /jobs/apply (producción antes de publicarlo) → 503 honesto.
 * - Los rechazos del backend (400, 429, 503) llegan con su mensaje.
 * - Al backend van exactamente sus campos, con el NOMBRE del puesto.
 * - Lo barato se corta acá sin llamar al backend (campos, tipo, tamaño).
 * - El campo trampa: "ok" para el bot, y no se envía nada.
 * - Los logs no llevan datos personales.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import { MAX_CV_BYTES } from "@/lib/careers/cvFile";
import { CAMPO_TRAMPA } from "@/lib/careers/campoTrampa";

const BACKEND = "http://backend.test";
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function archivo({ name = "cv.pdf", type = "application/pdf", size = 20 } = {}) {
  return new File([new Uint8Array(size)], name, { type });
}

function postular(campos = {}) {
  const form = new FormData();
  const datos = {
    puesto: "vendedor-autos",
    nombreApellido: "Ana Pérez",
    email: "ana@correo.com",
    telefono: "3815551234",
    mensaje: "Hola",
    cv: archivo(),
    ...campos,
  };
  for (const [clave, valor] of Object.entries(datos)) {
    if (valor !== undefined) form.append(clave, valor);
  }
  return POST(new Request("http://localhost/api/careers", { method: "POST", body: form }));
}

function backendResponde(cuerpo, { status = 200, contentType = "application/json" } = {}) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), {
      status,
      headers: { "content-type": contentType },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

let consola;
beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = BACKEND;
  consola = {
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
  };
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/careers → backend /jobs/apply", () => {
  it("si el backend confirma el envío, responde { ok: true }", async () => {
    backendResponde({ error: null, msg: "Postulación enviada correctamente" });
    const res = await postular();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("le manda al backend exactamente sus campos, con el nombre del puesto y el CV", async () => {
    const fetchMock = backendResponde({ error: null, msg: "ok" });
    await postular();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND}/jobs/apply`);
    expect(init.method).toBe("POST");
    const enviado = init.body;
    expect([...enviado.keys()].sort()).toEqual(
      ["cv", "email", "mensaje", "nombreApellido", "puesto", "telefono"].sort(),
    );
    expect(enviado.get("puesto")).toBe("Vendedor/a de Autos");
    expect(enviado.get("cv").name).toBe("cv.pdf");
  });

  it('el puesto "otro" llega como "Otro"', async () => {
    const fetchMock = backendResponde({ error: null, msg: "ok" });
    await postular({ puesto: "otro" });
    expect(fetchMock.mock.calls[0][1].body.get("puesto")).toBe("Otro");
  });

  it("acepta un Word (.docx) igual que un PDF", async () => {
    backendResponde({ error: null, msg: "ok" });
    const res = await postular({ cv: archivo({ name: "cv.docx", type: DOCX }) });
    expect(res.status).toBe(200);
  });

  it.each([
    ["backend de producción (sin /jobs/apply)", { error: true, msg: "Ruta no encontrada" }, "application/json"],
    ["Express sin manejador de 404", "<pre>Cannot POST /jobs/apply</pre>", "text/html"],
  ])("%s → 503 con mensaje honesto, y queda registrado", async (_caso, cuerpo, contentType) => {
    backendResponde(cuerpo, { status: 404, contentType });
    const res = await postular();

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/no podemos recibir postulaciones/);
    expect(consola.error).toHaveBeenCalled();
  });

  it.each([
    [400, "El contenido del CV no corresponde a un PDF o DOCX válido"],
    [429, "Demasiadas postulaciones. Intentá nuevamente más tarde"],
    [503, "No se pudo enviar la postulación. Intentá nuevamente más tarde"],
  ])("un %i del backend llega con su mensaje", async (status, msg) => {
    backendResponde({ error: true, msg }, { status });
    const res = await postular();

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ ok: false, error: msg });
  });

  it.each([
    ["un 500", { error: true, msg: "Error interno del servidor" }, 500, "application/json"],
    ["un 200 que no es JSON", "<html>ok</html>", 200, "text/html"],
    ["un 200 sin confirmar el envío", { algo: 1 }, 200, "application/json"],
  ])("%s no es un éxito: 502 con mensaje genérico", async (_caso, cuerpo, status, contentType) => {
    backendResponde(cuerpo, { status, contentType });
    const res = await postular();

    expect(res.status).toBe(502);
    expect((await res.json()).ok).toBe(false);
  });

  it("backend caído o que no responde: 502", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect((await postular()).status).toBe(502);
  });

  it("los logs no llevan nombre, email, teléfono ni mensaje", async () => {
    backendResponde({ error: true, msg: "Ruta no encontrada" }, { status: 404 });
    await postular();

    const todo = JSON.stringify([...consola.error.mock.calls, ...consola.warn.mock.calls, ...consola.log.mock.calls]);
    expect(todo).toContain("Vendedor/a de Autos");
    expect(todo).not.toMatch(/Ana|ana@correo\.com|3815551234|Hola/);
  });
});

describe("POST /api/careers: lo que se corta sin llamar al backend", () => {
  it.each([
    ["sin puesto", { puesto: undefined }],
    ["nombre corto", { nombreApellido: "A" }],
    ["email inválido", { email: "ana@" }],
    ["sin CV", { cv: undefined }],
    ["un JPG (el backend no lo acepta)", { cv: archivo({ name: "cv.jpg", type: "image/jpeg" }) }],
    ["extensión y tipo que no coinciden", { cv: archivo({ name: "cv.docx", type: "application/pdf" }) }],
    ["más de 4 MB", { cv: archivo({ size: MAX_CV_BYTES + 1 }) }],
  ])("%s → 400", async (_caso, campos) => {
    const fetchMock = backendResponde({ error: null });
    const res = await postular(campos);

    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("hasta 4 MB justos pasa", async () => {
    backendResponde({ error: null, msg: "ok" });
    expect((await postular({ cv: archivo({ size: MAX_CV_BYTES }) })).status).toBe(200);
  });

  it("lo que no es multipart → 400", async () => {
    const res = await POST(new Request("http://localhost/api/careers", { method: "POST", body: "{}" }));
    expect(res.status).toBe(400);
  });

  it("campo trampa completado: 'ok' para el bot y no se envía nada", async () => {
    const fetchMock = backendResponde({ error: null });
    const res = await postular({ [CAMPO_TRAMPA]: "http://spam.test" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
