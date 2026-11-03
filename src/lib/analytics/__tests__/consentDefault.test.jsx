/**
 * @vitest-environment jsdom
 *
 * El "default" de Consent Mode es lo que impide que GA4, la agencia y Meta
 * usen cookies antes de que la persona elija. Si este snippet se rompe en
 * silencio (está envuelto en try/catch), GTM no recibe default y las etiquetas
 * de Google se comportan como si hubiera permiso.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildConsentDefaultSnippet, CONSENT_STORAGE_KEY } from "../consent";
import ConsentBootstrap from "@/components/analytics/ConsentBootstrap";

function correrDefault() {
  window.dataLayer = [];
  delete window.gtag;
  new Function(buildConsentDefaultSnippet())();
  const cmd = window.dataLayer.find((e) => e[0] === "consent" && e[1] === "default");
  return cmd ? cmd[2] : null;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("consent default (antes de cualquier etiqueta)", () => {
  it("sin decisión: todo lo que guarda cookies arranca denegado", () => {
    expect(correrDefault()).toMatchObject({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  it("se empuja como objeto arguments, no como Array (GTM ignora los Array)", () => {
    correrDefault();
    const cmd = window.dataLayer.find((e) => e[0] === "consent");
    expect(Array.isArray(cmd)).toBe(false);
  });

  it("deja tiempo para que el banner actualice (wait_for_update > 0)", () => {
    expect(correrDefault().wait_for_update).toBeGreaterThan(0);
  });

  it("si ya aceptó, reaplica lo aceptado", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ads: true, ts: 1 }));
    expect(correrDefault()).toMatchObject({ analytics_storage: "granted", ad_storage: "granted" });
  });

  it("si rechazó, sigue denegado", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ads: false, ts: 1 }));
    expect(correrDefault()).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });

  it.each([
    ["valor roto", "{roto"],
    ["string 'true' en vez de booleano", JSON.stringify({ analytics: "true", ads: "true" })],
  ])("%s: denegado", (_n, raw) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    expect(correrDefault()).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });

  it("con localStorage bloqueado igual manda el default denegado", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(correrDefault()).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });
});

describe("ConsentBootstrap", () => {
  it("el script de <head> limpia la URL y después pone el default denegado", () => {
    const html = renderToStaticMarkup(<ConsentBootstrap />);
    const codigo = html.replace(/^<script>/, "").replace(/<\/script>$/, "");
    window.history.replaceState({}, "", "/postventa?utm_source=x&email=a%40b.com");
    window.dataLayer = [];
    new Function(codigo)();
    expect(window.location.search).toBe("?utm_source=x");
    const cmd = window.dataLayer.find((e) => e[0] === "consent" && e[1] === "default");
    expect(cmd?.[2]).toMatchObject({ analytics_storage: "denied", ad_storage: "denied" });
  });
});
