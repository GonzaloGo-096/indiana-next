/**
 * Casos de borde (auditoría QA del 2026-10-07): api.whatsapp.com sin text, caracteres especiales, "+" heredado,
 * hosts parecidos, fallback sin crypto.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { newLeadRef, withLeadRef } from "@/lib/analytics/leadRef";

const texto = (href) => new URL(href).searchParams.get("text");

afterEach(() => vi.unstubAllGlobals());

describe("withLeadRef: formas reales de los links del sitio", () => {
  it("api.whatsapp.com sin text (footer con mensaje vacío): crea el mensaje y conserva el teléfono", () => {
    const out = withLeadRef("https://api.whatsapp.com/send?phone=5438100", "AAAAA");
    const u = new URL(out);
    expect(u.searchParams.get("phone")).toBe("5438100");
    expect(u.searchParams.get("text")).toBe("Hola! (Ref. web AAAAA)");
    expect(u.pathname).toBe("/send");
  });

  it("api.whatsapp.com con text: el orden phone→text se conserva y text aparece una sola vez", () => {
    const out = withLeadRef("https://api.whatsapp.com/send?phone=1&text=Hola", "BBBBB");
    expect(out.startsWith("https://api.whatsapp.com/send?phone=1&text=")).toBe(true);
    expect(new URL(out).searchParams.getAll("text")).toHaveLength(1);
  });

  it("wa.me con text vacío (?text=) arranca el saludo", () => {
    expect(texto(withLeadRef("https://wa.me/1?text=", "CCCCC"))).toBe("Hola! (Ref. web CCCCC)");
  });
});

describe("withLeadRef: caracteres especiales", () => {
  const casos = [
    "Hola, me interesa el 208 & el 2008",
    "¿Precio? ñandú, acentos: camión, pingüino",
    "Emoji 🚗 y símbolos #1 50% +IVA = $10.000",
    "Línea 1\nLínea 2",
  ];
  for (const original of casos) {
    it(`ida y vuelta sin pérdida: ${JSON.stringify(original).slice(0, 40)}`, () => {
      const href = `https://wa.me/543816295959?text=${encodeURIComponent(original)}`;
      const out = withLeadRef(href, "K7Q2M");
      expect(texto(out)).toBe(`${original}\n\n(Ref. web K7Q2M)`);
      // nada sin codificar que corte la query o el fragmento
      expect(out.split("?")[1]).not.toMatch(/[ #+]/);
    });
  }

  it("un '+' heredado (form-encoding) se lee como espacio y sale como %20, nunca como '+'", () => {
    const out = withLeadRef("https://wa.me/1?text=Hola+mundo", "DDDDD");
    expect(texto(out)).toBe("Hola mundo\n\n(Ref. web DDDDD)");
    expect(out).not.toContain("+");
  });
});

describe("withLeadRef: qué cuenta como WhatsApp", () => {
  it("host en mayúsculas y web.whatsapp.com también llevan referencia", () => {
    expect(texto(withLeadRef("https://WA.ME/1", "EEEEE"))).toContain("(Ref. web EEEEE)");
    expect(texto(withLeadRef("https://web.whatsapp.com/send?phone=1", "EEEEE"))).toContain("(Ref. web EEEEE)");
  });

  it("dominios parecidos no se tocan", () => {
    for (const h of ["https://evilwa.me/1", "https://wa.me.evil.com/1", "https://whatsapp.com.ar/1", "https://notwhatsapp.com/1"]) {
      expect(withLeadRef(h, "F")).toBe(h);
    }
  });

  it("vacío, undefined y relativos quedan igual (no rompen el botón)", () => {
    expect(withLeadRef("", "F")).toBe("");
    expect(withLeadRef(undefined, "F")).toBe(undefined);
    expect(withLeadRef("/contacto", "F")).toBe("/contacto");
  });
});

describe("newLeadRef", () => {
  it("sin crypto.getRandomValues usa el respaldo y mantiene el formato", () => {
    vi.stubGlobal("crypto", undefined);
    for (let i = 0; i < 50; i++) expect(newLeadRef()).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
  });
});
