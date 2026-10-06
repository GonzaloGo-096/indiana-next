import { describe, it, expect } from "vitest";
import { newLeadRef, withLeadRef } from "../leadRef";

describe("newLeadRef", () => {
  it("5 caracteres, sin los que se confunden al copiarlos a mano", () => {
    for (let i = 0; i < 200; i++) expect(newLeadRef()).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
  });
});

describe("withLeadRef", () => {
  it("suma la referencia al mensaje de wa.me, con espacios bien codificados", () => {
    const out = withLeadRef("https://wa.me/543816295959?text=Hola%2C%20me%20interesa%20el%20208", "K7Q2M");
    expect(out).toBe("https://wa.me/543816295959?text=Hola%2C%20me%20interesa%20el%20208%0A%0A(Ref.%20web%20K7Q2M)");
    expect(out).not.toContain("+");
  });

  it("respeta los otros parámetros de api.whatsapp.com (el teléfono del footer)", () => {
    const out = new URL(withLeadRef("https://api.whatsapp.com/send?phone=5438100&text=Hola", "AAAAA"));
    expect(out.searchParams.get("phone")).toBe("5438100");
    expect(out.searchParams.get("text")).toBe("Hola\n\n(Ref. web AAAAA)");
  });

  it("sin mensaje prellenado arranca uno", () => {
    expect(new URL(withLeadRef("https://wa.me/1", "BBBBB")).searchParams.get("text")).toBe("Hola! (Ref. web BBBBB)");
  });

  it("un link que no es de WhatsApp o no se puede leer queda igual", () => {
    expect(withLeadRef("https://example.com/?text=x", "C")).toBe("https://example.com/?text=x");
    expect(withLeadRef("no es una url", "C")).toBe("no es una url");
  });
});
