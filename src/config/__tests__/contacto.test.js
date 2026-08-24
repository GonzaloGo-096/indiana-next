/**
 * Invariantes de los datos de contacto.
 *
 * No prueban código: prueban que los datos cumplan las reglas que los hacen
 * seguros de usar. Son las dos que ya se rompieron una vez.
 */

import { describe, it, expect } from "vitest";
import { SEDES, AREAS_DE_CONTACTO } from "@/config/contacto";

const TODAS = Object.values(SEDES);

describe("teléfonos de las sedes", () => {
  it("declara el e164 en formato internacional, sin el 0 nacional", () => {
    for (const sede of TODAS) {
      expect(sede.telefono.e164).toMatch(/^\+54[1-9]\d+$/);
    }
  });

  it("no deriva el e164 del texto que se muestra", () => {
    // Este es el error que se está evitando: sacar los dígitos de
    // "(0381) 231-3107" y anteponerle +54 da +5403812313107, que no existe.
    const derivadoAMano = `+54${SEDES.usados.telefono.texto.replace(/[^\d]/g, "")}`;

    expect(derivadoAMano).toBe("+5403812313107");
    expect(SEDES.usados.telefono.e164).not.toBe(derivadoAMano);
    expect(SEDES.usados.telefono.e164).toBe("+543812313107");
  });

  it("muestra el teléfono en formato nacional", () => {
    for (const sede of TODAS) {
      expect(sede.telefono.texto).toMatch(/^\(0\d{3}\) \d{3}-\d{4}$/);
    }
  });
});

describe("sedes", () => {
  it("tiene todos los datos en todas: nada de valores por defecto", () => {
    // Antes faltar un dato no fallaba: se publicaba @indianausados apuntando a
    // la portada de Instagram, o un teléfono de Buenos Aires.
    for (const sede of TODAS) {
      expect(sede.id).toBeTruthy();
      expect(sede.nombre).toBeTruthy();
      expect(sede.whatsapp.phone).toBeTruthy();
      expect(sede.whatsapp.mensaje).toBeTruthy();
      expect(sede.instagram).toBeTruthy();
      expect(sede.direccion).toBeTruthy();
    }
  });

  it("no repite ids", () => {
    const ids = TODAS.map((sede) => sede.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("usa el usuario de Instagram sin arroba", () => {
    for (const sede of TODAS) {
      expect(sede.instagram.startsWith("@")).toBe(false);
    }
  });
});

describe("áreas de contacto", () => {
  it("agrupa siempre en sedes, aunque haya una sola", () => {
    for (const area of AREAS_DE_CONTACTO) {
      expect(Array.isArray(area.sedes)).toBe(true);
      expect(area.sedes.length).toBeGreaterThan(0);
    }
  });

  it("conserva los ids que hoy viajan a GA4", () => {
    // Si cambian, se corta la serie histórica de los reportes.
    expect(AREAS_DE_CONTACTO.map((area) => area.id)).toEqual([
      "peugeot-oficial",
      "multimarca-usados",
      "posventa-taller",
    ]);

    expect(AREAS_DE_CONTACTO.flatMap((area) => area.sedes.map((s) => s.id))).toEqual([
      "peugeot-san-miguel",
      "peugeot-yerbabuena",
      "multimarca-usados",
      "posventa-taller",
    ]);
  });
});
