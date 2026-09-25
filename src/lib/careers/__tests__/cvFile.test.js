import { describe, it, expect } from "vitest";
import { MAX_CV_BYTES, MAX_CV_LABEL, CV_ACCEPT, esCvAceptado } from "../cvFile";

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

describe("esCvAceptado: espejo de la regla del backend (extensión y tipo coinciden)", () => {
  const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  it("acepta PDF y Word (.docx), sin importar mayúsculas en la extensión", () => {
    expect(esCvAceptado({ name: "cv.pdf", type: "application/pdf" })).toBe(true);
    expect(esCvAceptado({ name: "Mi CV.PDF", type: "application/pdf" })).toBe(true);
    expect(esCvAceptado({ name: "cv.docx", type: DOCX })).toBe(true);
  });

  it("rechaza otros tipos (el backend no acepta JPG ni el Word viejo .doc)", () => {
    expect(esCvAceptado({ name: "cv.jpg", type: "image/jpeg" })).toBe(false);
    expect(esCvAceptado({ name: "cv.doc", type: "application/msword" })).toBe(false);
  });

  it("rechaza si la extensión y el tipo no coinciden, o faltan", () => {
    expect(esCvAceptado({ name: "cv.pdf", type: DOCX })).toBe(false);
    expect(esCvAceptado({ name: "cv", type: "application/pdf" })).toBe(false);
    expect(esCvAceptado({ name: "cv.pdf", type: "" })).toBe(false);
    expect(esCvAceptado(undefined)).toBe(false);
  });

  it("el accept del input ofrece exactamente esos tipos", () => {
    expect(CV_ACCEPT.split(",")).toEqual([".pdf", ".docx", "application/pdf", DOCX]);
  });
});
