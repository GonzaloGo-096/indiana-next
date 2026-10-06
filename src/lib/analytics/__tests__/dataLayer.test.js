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
    expect(window.dataLayer).toEqual([
      {
        event: "whatsapp_click",
        location: "usados_detail",
        component_id: "whatsapp-card-detalle-usado",
      },
    ]);
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
