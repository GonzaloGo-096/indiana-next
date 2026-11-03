/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { buildIndianaGtmSnippet, buildMarketingGtmSnippet, isProductionHost } from "../gtmLoader";

// Ejecuta el script del cargador como lo haría el navegador, pero con el
// dominio que se le pase (jsdom siempre es "localhost").
function correr(hostname, opts) {
  const win = { dataLayer: [] };
  new Function("window", "document", "location", buildIndianaGtmSnippet("GTM-TEST", opts))(
    win,
    document,
    { hostname },
  );
  const cargado = [...document.querySelectorAll("script[src]")].some((s) =>
    s.src.includes("googletagmanager.com/gtm.js?id=GTM-TEST"),
  );
  return { cargado, dataLayer: win.dataLayer };
}

beforeEach(() => {
  document.head.innerHTML = "<script></script>";
});

describe("isProductionHost", () => {
  it("solo el dominio de Indiana", () => {
    expect(isProductionHost("www.indiana.com.ar")).toBe(true);
    expect(isProductionHost("indiana.com.ar")).toBe(true);
    expect(isProductionHost("localhost")).toBe(false);
    expect(isProductionHost("indiana-next-abc-gonzalos-projects.vercel.app")).toBe(false);
    expect(isProductionHost("otroindiana.com.ar")).toBe(false);
    expect(isProductionHost("indiana.com.ar.evil.com")).toBe(false);
    // ni siquiera un subdominio propio: podría apuntar a una versión de prueba
    expect(isProductionHost("staging.indiana.com.ar")).toBe(false);
  });
});

describe("cargador de nuestro GTM", () => {
  it("en producción carga y no marca nada como prueba", () => {
    const r = correr("www.indiana.com.ar");
    expect(r.cargado).toBe(true);
    expect(r.dataLayer.some((e) => e.analytics_test)).toBe(false);
  });

  it("en producción, aunque esté prendida la variable de prueba, no marca prueba", () => {
    const r = correr("www.indiana.com.ar", { allowNonProduction: true });
    expect(r.cargado).toBe(true);
    expect(r.dataLayer.some((e) => e.analytics_test)).toBe(false);
  });

  it("en localhost o una versión de prueba, sin pedirlo, no carga", () => {
    expect(correr("localhost").cargado).toBe(false);
    expect(correr("indiana-next-abc.vercel.app").cargado).toBe(false);
  });

  it("pedido a propósito fuera de producción: carga y marca la visita como prueba antes que GTM", () => {
    const r = correr("indiana-next-abc.vercel.app", { allowNonProduction: true });
    expect(r.cargado).toBe(true);
    const iPrueba = r.dataLayer.findIndex((e) => e.analytics_test === true);
    const iGtm = r.dataLayer.findIndex((e) => e.event === "gtm.js");
    expect(iPrueba).toBeGreaterThanOrEqual(0);
    expect(iPrueba).toBeLessThan(iGtm);
  });
});

describe("cargador del GTM de la agencia", () => {
  function correrAgencia(hostname) {
    new Function("window", "document", "location", buildMarketingGtmSnippet("GTM-AGENCIA"))(
      { dataLayer: [] },
      document,
      { hostname },
    );
    return [...document.querySelectorAll("script[src]")].some((s) =>
      s.src.includes("googletagmanager.com/gtm.js?id=GTM-AGENCIA"),
    );
  }

  it("carga en el sitio real", () => {
    expect(correrAgencia("indiana.com.ar")).toBe(true);
  });

  // Sus conversiones de Ads y su remarketing no tienen marca de prueba: un
  // clic en una copia contaría como un contacto real para la agencia.
  it("no carga en copias de prueba ni en local", () => {
    expect(correrAgencia("indiana-next-abc-gonzalos-projects.vercel.app")).toBe(false);
    expect(correrAgencia("localhost")).toBe(false);
  });
});
