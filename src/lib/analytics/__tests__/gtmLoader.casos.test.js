/**
 * @vitest-environment jsdom
 *
 * Casos de borde del cargador (auditoría QA del 2026-10-07): hosts de preview reales, mayúsculas/punto final, id con comillas,
 * dataLayer previo (consent default) preservado, marca solo una vez.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { buildIndianaGtmSnippet, isProductionHost } from "@/lib/analytics/gtmLoader";

function correr(hostname, opts, id = "GTM-TEST", dataLayer = []) {
  const win = { dataLayer };
  new Function("window", "document", "location", buildIndianaGtmSnippet(id, opts))(win, document, { hostname });
  const scripts = [...document.querySelectorAll("script[src]")].map((s) => s.src);
  return { scripts, dataLayer: win.dataLayer };
}

beforeEach(() => {
  document.head.innerHTML = "<script></script>";
});

describe("isProductionHost: casos borde", () => {
  it.each([
    ["indiana-next.vercel.app", false],
    ["indiana-next-git-refactor-medicion-simple-gonzalos-projects.vercel.app", false],
    ["127.0.0.1", false],
    ["www.indiana.com.ar.", false], // FQDN con punto final: hoy no carga GTM (documenta)
    ["wwwindiana.com.ar", false],
    ["www.indiana.com", false],
    ["", false],
    [undefined, false],
  ])("%s → %s", (host, esperado) => {
    expect(isProductionHost(host)).toBe(esperado);
  });
});

describe("snippet del cargador", () => {
  it("en producción inserta exactamente un gtm.js y no deja marca de prueba", () => {
    const r = correr("indiana.com.ar");
    expect(r.scripts.filter((s) => s.includes("gtm.js?id=GTM-TEST"))).toHaveLength(1);
    expect(r.dataLayer.some((e) => "analytics_test" in e)).toBe(false);
  });

  it("en preview sin permiso no crea el dataLayer ni toca lo que había", () => {
    const previo = [{ "0": "consent" }];
    const r = correr("indiana-next.vercel.app", undefined, "GTM-TEST", previo);
    expect(r.dataLayer).toBe(previo);
    expect(r.dataLayer).toHaveLength(1);
    expect(r.scripts).toHaveLength(0);
  });

  it("en preview con permiso conserva el consentimiento previo y marca prueba una sola vez", () => {
    const consent = { "0": "consent", "1": "default" };
    const r = correr("localhost", { allowNonProduction: true }, "GTM-TEST", [consent]);
    expect(r.dataLayer[0]).toBe(consent);
    expect(r.dataLayer.filter((e) => e.analytics_test === true)).toHaveLength(1);
  });

  it("un id con comillas no rompe ni inyecta código (se serializa con JSON.stringify)", () => {
    const malo = `GTM-X');window.__pwn=1;//`;
    expect(() => correr("indiana.com.ar", undefined, malo)).not.toThrow();
    expect(window.__pwn).toBeUndefined();
  });

  it("solo true habilita la carga fuera de producción: el string \"false\" no", () => {
    // MarketingTracking pasa process.env... === "true", así que siempre es booleano;
    // esto protege contra que alguien pase el string directo.
    expect(correr("localhost", { allowNonProduction: "false" }).scripts.some((s) => s.includes("gtm.js"))).toBe(false);
    expect(correr("localhost", { allowNonProduction: "true" }).scripts.some((s) => s.includes("gtm.js"))).toBe(false);
    expect(correr("localhost", { allowNonProduction: true }).scripts.some((s) => s.includes("gtm.js"))).toBe(true);
  });
});
