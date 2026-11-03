/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { track, pushGtagCommand } from "../dataLayer";

beforeEach(() => {
  window.dataLayer = [];
  window.history.pushState({}, "", "/");
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("track", () => {
  it("agrega la sección del sitio sacada de la URL", () => {
    window.history.pushState({}, "", "/usados/peugeot-208-2023-abc");
    track("whatsapp_click", { component_id: "whatsapp-card-detalle-usado" });
    // [1] es el aviso de compatibilidad generate_lead (probado más abajo).
    expect(window.dataLayer[0]).toEqual({
      event: "whatsapp_click",
      location: "usados_detail",
      component_id: "whatsapp-card-detalle-usado",
    });
  });

  it("vacía el auto y el botón del evento anterior (GTM los recuerda)", () => {
    track("view_item", { item_id: "208", item_name: "Peugeot 208", item_category: "0km" });
    track("whatsapp_click", { component_id: "whatsapp-floating" });
    const ultimo = window.dataLayer[1];
    for (const k of ["item_id", "item_name", "item_category"]) {
      expect(Object.prototype.hasOwnProperty.call(ultimo, k)).toBe(true);
      expect(ultimo[k]).toBeUndefined();
    }
    expect(ultimo.component_id).toBe("whatsapp-floating");
  });

  it("un WhatsApp después de una postulación no arrastra su form_id", () => {
    track("form_submit", { form_id: "careers" });
    track("whatsapp_click", { component_id: "whatsapp-floating" });
    const wa = window.dataLayer.find((e) => e.event === "whatsapp_click");
    expect(Object.prototype.hasOwnProperty.call(wa, "form_id")).toBe(true);
    expect(wa.form_id).toBeUndefined();
  });

  it("una búsqueda sin marca no hereda la marca de la anterior", () => {
    track("view_search_results", { results_count: 3, filters_count: 1, marca: "Ford" });
    track("view_search_results", { results_count: 9, filters_count: 1 });
    expect(Object.prototype.hasOwnProperty.call(window.dataLayer[1], "marca")).toBe(true);
    expect(window.dataLayer[1].marca).toBeUndefined();
  });

  it("descarta claves con forma de dato personal", () => {
    track("form_submit", { form_id: "careers", email: "a@b.com", Telefono: "381" });
    expect(window.dataLayer[0]).toEqual({ event: "form_submit", location: "home", form_id: "careers" });
  });

  it("no manda valores vacíos ni objetos", () => {
    track("view_item", { item_id: "x", item_name: "", extra: null, obj: { a: 1 }, n: NaN });
    expect(window.dataLayer[0]).toEqual({ event: "view_item", location: "home", item_id: "x" });
  });

  it("corta textos largos", () => {
    track("view_item", { item_name: "a".repeat(600) });
    expect(window.dataLayer[0].item_name).toHaveLength(500);
  });

  it("si el dataLayer no es empujable, no rompe al que hizo clic", () => {
    window.dataLayer = { push: () => { throw new Error("roto"); } };
    expect(() => track("whatsapp_click", {})).not.toThrow();
  });
});

describe("pushGtagCommand", () => {
  it("empuja el objeto arguments, no un Array (GTM ignora los Array)", () => {
    pushGtagCommand("consent", "update", { analytics_storage: "granted" });
    const cmd = window.dataLayer[0];
    expect(Array.isArray(cmd)).toBe(false);
    expect(Array.from(cmd)).toEqual(["consent", "update", { analytics_storage: "granted" }]);
  });
});

describe("track: aviso de compatibilidad generate_lead", () => {
  // El GTM publicado (v9) cuenta "Leads" con el generate_lead que empuja el
  // sitio. Mientras exista, el código lo sigue empujando junto a cada
  // contacto: así código nuevo con GTM v9 no deja "Leads" en 0, y el día de
  // salida el orden entre GTM y código no importa (auditoría de releases
  // 2026-10-26). El GTM nuevo no lo escucha (test de contrato).
  const leads = () => window.dataLayer.filter((e) => e.event === "generate_lead");

  it("cada WhatsApp empuja después un generate_lead con los mismos datos y lead_source", () => {
    window.history.pushState({}, "", "/0km/208");
    track("whatsapp_click", { component_id: "whatsapp-floating", lead_ref: "K7Q2M", item_id: "208" });
    expect(window.dataLayer.map((e) => e.event)).toEqual(["whatsapp_click", "generate_lead"]);
    expect(leads()[0]).toMatchObject({
      lead_source: "whatsapp",
      location: "okm_detail",
      component_id: "whatsapp-floating",
      lead_ref: "K7Q2M",
      item_id: "208",
    });
  });

  it("teléfono → lead_source phone", () => {
    track("phone_click", { component_id: "footer-tel" });
    expect(leads()).toEqual([expect.objectContaining({ lead_source: "phone", component_id: "footer-tel" })]);
  });

  it("solo la postulación cuenta como form; otro formulario no", () => {
    track("form_submit", { form_id: "careers" });
    track("form_submit", { form_id: "otro" });
    expect(leads()).toEqual([expect.objectContaining({ lead_source: "form", form_id: "careers" })]);
  });

  it("lead_source no queda pegado en GTM: el evento siguiente lo lleva vacío", () => {
    // La v9 lee {{DLV - lead_source}} también en whatsapp_click: sin vaciarlo,
    // un WhatsApp después de un teléfono salía con lead_source=phone.
    track("phone_click", { component_id: "footer-tel" });
    track("whatsapp_click", { component_id: "whatsapp-floating" });
    const wa = window.dataLayer.find((e) => e.event === "whatsapp_click");
    expect(Object.prototype.hasOwnProperty.call(wa, "lead_source")).toBe(true);
    expect(wa.lead_source).toBeUndefined();
  });

  it("visitas, fichas y búsquedas no son contactos", () => {
    track("page_view", {});
    track("view_item", { item_id: "208" });
    track("view_search_results", { results_count: 3 });
    expect(leads()).toEqual([]);
  });
});
