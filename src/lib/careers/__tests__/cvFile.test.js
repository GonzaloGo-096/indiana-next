import { describe, it, expect } from "vitest";
import { MAX_CV_BYTES, MAX_CV_LABEL, detectCvType } from "../cvFile";

// Límite de Vercel para el cuerpo de un pedido a una función (incluye los
// campos del formulario, no solo el archivo). Por encima responde 413.
const LIMITE_VERCEL = 4.5 * 1024 * 1024;
const MARGEN_PARA_CAMPOS = 256 * 1024;

describe("tope del CV", () => {
  it("entra en el límite de Vercel con margen para el resto del formulario", () => {
    expect(MAX_CV_BYTES + MARGEN_PARA_CAMPOS).toBeLessThanOrEqual(LIMITE_VERCEL);
  });

  it("el texto que ve el visitante dice el mismo número", () => {
    expect(MAX_CV_LABEL).toBe(`${MAX_CV_BYTES / 1024 / 1024} MB`);
  });
});

describe("detectCvType", () => {
  const bytes = (...b) => new Uint8Array(b);

  it("reconoce PDF y JPG por su firma", () => {
    expect(detectCvType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31))).toBe("pdf");
    expect(detectCvType(bytes(0xff, 0xd8, 0xff, 0xe1))).toBe("jpg");
  });

  it("devuelve null para cualquier otra cosa, incluso firmas incompletas", () => {
    expect(detectCvType(bytes(0x89, 0x50, 0x4e, 0x47))).toBeNull(); // PNG
    expect(detectCvType(bytes(0x25, 0x50, 0x44))).toBeNull(); // "%PD"
    expect(detectCvType(bytes())).toBeNull();
  });
});
