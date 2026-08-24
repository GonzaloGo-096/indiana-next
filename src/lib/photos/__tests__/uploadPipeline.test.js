/**
 * Tests del pipeline de subida de fotos.
 *
 * Cubre el camino que hasta ahora no tenía ningún test: el de Sharp. El test
 * de integración de /api/photos/create evita a propósito mandar archivos para
 * no ejecutar Sharp, así que la optimización real —el corazón de la carga de
 * autos— estaba sin red.
 *
 * Sirve además para fijar el contrato tras el salto de sharp 0.34 a 0.35.
 */

import { describe, it, expect } from "vitest";
import sharp from "sharp";
import {
  isImageFile,
  optimizeImage,
  processFormData,
  requireBearerToken,
  checkPayloadSize,
  IMAGE_OPTIMIZATION,
  MAX_UPLOAD_BYTES,
} from "../uploadPipeline";

// Logger mudo: acá se testea el pipeline, no el logging.
const log = { debug() {}, info() {}, warn() {}, error() {} };

async function makeJpeg(width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 30, b: 30 },
    },
  })
    .jpeg()
    .toBuffer();
}

function asFile(buffer, name = "foto.jpg", type = "image/jpeg") {
  return new File([buffer], name, { type });
}

describe("uploadPipeline — optimización con Sharp", () => {
  it("convierte a webp", async () => {
    const file = asFile(await makeJpeg(400, 300));

    const out = await optimizeImage(file, log);

    expect(out).not.toBeNull();
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe("webp");
  });

  it("achica una imagen más ancha que el máximo", async () => {
    const file = asFile(await makeJpeg(3000, 2000));

    const out = await optimizeImage(file, log);

    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(IMAGE_OPTIMIZATION.maxWidth);
    // La proporción se mantiene: 3000x2000 → 1200x800
    expect(meta.height).toBe(800);
  });

  it("no agranda una imagen más chica que el máximo", async () => {
    const file = asFile(await makeJpeg(500, 400));

    const out = await optimizeImage(file, log);

    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(500);
  });

  it("devuelve null si el archivo no es una imagen válida", async () => {
    const file = asFile(Buffer.from("esto no es una imagen"), "roto.jpg");

    const out = await optimizeImage(file, log);

    expect(out).toBeNull();
  });
});

describe("uploadPipeline — recorrido del FormData", () => {
  it("optimiza las imágenes y deja los campos de texto intactos", async () => {
    const formData = new FormData();
    formData.append("marca", "Peugeot");
    formData.append("precio", "12000000");
    formData.append("fotoPrincipal", asFile(await makeJpeg(2000, 1000)));

    const out = await processFormData(formData, log);

    expect(out.get("marca")).toBe("Peugeot");
    expect(out.get("precio")).toBe("12000000");

    const foto = out.get("fotoPrincipal");
    expect(foto).toBeInstanceOf(File);
    expect(foto.type).toBe("image/webp");
    expect(foto.name).toBe("foto.webp"); // cambia la extensión
  });

  it("reenvía el original si Sharp no puede procesarlo", async () => {
    const formData = new FormData();
    formData.append("fotoPrincipal", asFile(Buffer.from("corrupto"), "x.jpg"));

    const out = await processFormData(formData, log);

    const foto = out.get("fotoPrincipal");
    expect(foto).toBeInstanceOf(File);
    // No se convirtió: se mantiene el archivo tal cual llegó.
    expect(foto.type).toBe("image/jpeg");
  });

  it("un FormData sin imágenes pasa igual (caso de edición sin fotos)", async () => {
    const formData = new FormData();
    formData.append("precio", "9990000");

    const out = await processFormData(formData, log);

    expect([...out.keys()]).toEqual(["precio"]);
    expect(out.get("precio")).toBe("9990000");
  });
});

describe("uploadPipeline — detección de imágenes", () => {
  it("reconoce un File de imagen", async () => {
    expect(isImageFile(asFile(await makeJpeg(10, 10)))).toBe(true);
  });

  it("descarta strings y nulos", () => {
    expect(isImageFile("Peugeot")).toBe(false);
    expect(isImageFile(null)).toBe(false);
    expect(isImageFile(undefined)).toBe(false);
  });

  it("descarta archivos que no son imagen", () => {
    expect(isImageFile(new File([Buffer.from("x")], "cv.pdf", { type: "application/pdf" }))).toBe(
      false,
    );
  });
});

describe("uploadPipeline — porteros", () => {
  function req(headers = {}) {
    return new Request("http://localhost/api/photos/create", {
      method: "POST",
      headers: new Headers(headers),
    });
  }

  it("acepta un Bearer con contenido", () => {
    const r = requireBearerToken(req({ Authorization: "Bearer abc123" }), log);
    expect(r.ok).toBe(true);
    expect(r.authHeader).toBe("Bearer abc123");
  });

  it("rechaza sin header, con Basic, o con Bearer vacío", () => {
    for (const headers of [{}, { Authorization: "Basic abc" }, { Authorization: "Bearer   " }]) {
      const r = requireBearerToken(req(headers), log);
      expect(r.ok).toBe(false);
      expect(r.response.status).toBe(401);
    }
  });

  it("deja pasar un tamaño dentro del máximo", () => {
    const r = checkPayloadSize(req({ "content-length": "1000" }), log);
    expect(r.ok).toBe(true);
  });

  it("corta con 413 cuando el tamaño declarado supera el máximo", () => {
    const r = checkPayloadSize(req({ "content-length": String(MAX_UPLOAD_BYTES + 1) }), log);
    expect(r.ok).toBe(false);
    expect(r.response.status).toBe(413);
  });
});
