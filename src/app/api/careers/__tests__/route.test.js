/**
 * Contrato de /api/careers.
 *
 * Lo que se fija: la API nunca dice { ok: true } mientras el envío por email no
 * exista (antes lo decía y las postulaciones se perdían en silencio), y el CV
 * se valida por su contenido y por un tamaño que Vercel deja pasar.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import { MAX_CV_BYTES } from "@/lib/careers/cvFile";

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const JPG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];

function archivo(bytes, { name = "cv.pdf", type = "application/pdf", size } = {}) {
  const contenido = new Uint8Array(size ?? bytes.length);
  contenido.set(bytes);
  return new File([contenido], name, { type });
}

function postular(campos = {}) {
  const form = new FormData();
  const datos = {
    puesto: "Vendedor",
    nombreApellido: "Ana Pérez",
    email: "ana@correo.com",
    cv: archivo(PDF),
    ...campos,
  };
  for (const [clave, valor] of Object.entries(datos)) {
    if (valor !== undefined) form.append(clave, valor);
  }
  return POST(new Request("http://localhost/api/careers", { method: "POST", body: form }));
}

let consoleError;
beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("POST /api/careers", () => {
  it("con una postulación válida NO dice que la envió: 503 y mensaje para el visitante", async () => {
    const res = await postular();
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/no podemos recibir postulaciones/);
  });

  it("deja registro del intento perdido, sin datos personales", async () => {
    await postular();

    expect(consoleError).toHaveBeenCalledTimes(1);
    const registrado = JSON.stringify(consoleError.mock.calls[0]);
    expect(registrado).toContain("Vendedor");
    expect(registrado).not.toMatch(/Ana|ana@correo\.com/);
  });

  it("acepta un JPG real igual que un PDF (llega al mismo 503)", async () => {
    const res = await postular({ cv: archivo(JPG, { name: "cv.jpg", type: "image/jpeg" }) });
    expect(res.status).toBe(503);
  });

  it("rechaza un archivo que dice ser PDF pero no lo es", async () => {
    const falso = archivo([0x4d, 0x5a, 0x90, 0x00], { name: "cv.pdf" }); // un .exe renombrado
    const res = await postular({ cv: falso });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El archivo no es un PDF o JPG válido");
  });

  it("rechaza tipos no permitidos aunque el contenido sea válido", async () => {
    const res = await postular({ cv: archivo(PDF, { name: "cv.png", type: "image/png" }) });
    expect(res.status).toBe(400);
  });

  it("acepta hasta 4 MB y rechaza un byte más", async () => {
    expect((await postular({ cv: archivo(PDF, { size: MAX_CV_BYTES }) })).status).toBe(503);

    const res = await postular({ cv: archivo(PDF, { size: MAX_CV_BYTES + 1 }) });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El archivo no debe superar 4 MB");
  });

  it.each([
    ["sin puesto", { puesto: undefined }],
    ["nombre corto", { nombreApellido: "A" }],
    ["email inválido", { email: "ana@" }],
    ["sin CV", { cv: undefined }],
  ])("valida los campos: %s → 400", async (_caso, campos) => {
    const res = await postular(campos);
    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  it("rechaza lo que no es multipart", async () => {
    const res = await POST(
      new Request("http://localhost/api/careers", { method: "POST", body: "{}" })
    );
    expect(res.status).toBe(400);
  });
});
