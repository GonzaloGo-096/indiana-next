/**
 * @vitest-environment jsdom
 *
 * Casos de borde (auditoría QA del 2026-10-07): RESET_KEYS contra el contrato
 * con GTM, 0/false que sí tienen que viajar, claves reservadas, marca de prueba
 * y datos personales.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { track, RESET_KEYS } from "@/lib/analytics/dataLayer";
import { CONTRATO, PUENTE, MARCA_PRUEBA } from "../../../../scripts/gtm-definition.mjs";
import { sinCompat } from "@/lib/analytics/__tests__/helpers";

beforeEach(() => {
  window.dataLayer = [];
  window.history.pushState({}, "", "/");
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// Lo mínimo que manda cada emisor real (asunción tomada de los componentes:
// WhatsAppLink sin item, TelLink, PageViewTracker, ItemViewTracker, el hook
// del listado sin marca y CareersForm).
const MINIMO = {
  page_view: { page_location: "http://x/", page_title: "t" },
  view_item: { item_id: "a", item_name: "A", item_category: "0km" },
  whatsapp_click: { component_id: "whatsapp-floating", lead_ref: "AAAAA" },
  phone_click: { component_id: "footer-tel" },
  view_search_results: { results_count: 1, filters_count: 1 },
  form_submit: { form_id: "careers" },
};

// Todo lo que algún evento puede dejar "pegado" en el modelo de datos de GTM.
const TODO = {
  component_id: "viejo-boton",
  lead_ref: "VIEJO",
  item_id: "viejo",
  item_name: "Viejo",
  item_category: "usado",
  marca: "Ford",
  form_id: "careers",
};

/** Parámetros que GTM lee cuando llega `ev` (su etiqueta + el puente si dispara). */
function leidosPor(ev) {
  const puente = PUENTE.disparadores.some((d) => d.split(":")[0] === ev) ? PUENTE.parametros : [];
  return [...new Set([...CONTRATO[ev], ...puente])].filter((p) => p !== "location");
}

describe("RESET_KEYS cubre todo lo que GTM leería de un evento anterior", () => {
  it("son exactamente los parámetros del contrato y del puente, menos location", () => {
    const todos = new Set([...Object.values(CONTRATO).flat(), ...PUENTE.parametros]);
    todos.delete("location");
    expect([...RESET_KEYS].sort()).toEqual([...todos].sort());
  });

  for (const ev of Object.keys(CONTRATO)) {
    it(`${ev}: lo que no manda queda vaciado, no heredado`, () => {
      track("evento_previo", TODO);
      track(ev, MINIMO[ev]);
      const ultimo = sinCompat().at(-1);
      const heredables = leidosPor(ev).filter((p) => !(p in MINIMO[ev]) && p in TODO);
      for (const p of heredables) {
        expect(Object.prototype.hasOwnProperty.call(ultimo, p), `${ev}.${p} no se vacía`).toBe(true);
        expect(ultimo[p], `${ev}.${p}`).toBeUndefined();
      }
    });
  }

  it("una postulación después de un WhatsApp no le pasa el botón ni la referencia al generate_lead", () => {
    track("whatsapp_click", { component_id: "whatsapp-floating", lead_ref: "K7Q2M" });
    track("form_submit", { form_id: "careers" });
    const ev = sinCompat()[1];
    expect(Object.prototype.hasOwnProperty.call(ev, "component_id")).toBe(true);
    expect(ev.component_id).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(ev, "lead_ref")).toBe(true);
    expect(ev.lead_ref).toBeUndefined();
  });
});

describe("valores que sí tienen que viajar", () => {
  it("una búsqueda sin resultados manda results_count 0 (no se descarta por falsy)", () => {
    track("view_search_results", { results_count: 0, filters_count: 0 });
    expect(sinCompat()[0]).toMatchObject({ results_count: 0, filters_count: 0 });
  });

  it("false viaja; Infinity no", () => {
    track("x", { a: false, b: Infinity, c: -Infinity });
    expect(sinCompat()[0].a).toBe(false);
    expect("b" in sinCompat()[0] && sinCompat()[0].b !== undefined).toBe(false);
  });
});

describe("claves reservadas y marca de prueba", () => {
  it("un parámetro llamado `event` no pisa el nombre del evento", () => {
    track("whatsapp_click", { event: "otro" });
    expect(sinCompat()[0].event).toBe("whatsapp_click");
  });

  it("un parámetro `location` no pisa la sección sacada de la URL", () => {
    window.history.pushState({}, "", "/0km/208");
    track("whatsapp_click", { location: "home" });
    expect(sinCompat()[0].location).toBe("okm_detail");
  });

  it(`${MARCA_PRUEBA} nunca viaja en un evento, ni con false (GTM mandaría debug_mode)`, () => {
    track("whatsapp_click", { [MARCA_PRUEBA]: true });
    track("whatsapp_click", { [MARCA_PRUEBA]: false });
    expect(sinCompat().map((e) => MARCA_PRUEBA in e)).toEqual([false, false]);
  });

  it("PII: también se descartan las variantes del nombre de la clave", () => {
    track("form_submit", { form_id: "careers", user_email: "a@b.com", nombreApellido: "Juan", Telefono2: "381" });
    expect(Object.keys(sinCompat()[0]).filter((k) => sinCompat()[0][k] !== undefined).sort()).toEqual(["event", "form_id", "location"]);
  });

  it("PII: los parámetros del contrato no caen en el filtro", () => {
    for (const [ev, ps] of Object.entries(CONTRATO)) {
      window.dataLayer = [];
      const enviados = Object.fromEntries(ps.filter((p) => p !== "location").map((p) => [p, "x"]));
      track(ev, enviados);
      expect(sinCompat()[0], ev).toMatchObject(enviados);
    }
  });
});
