/**
 * @vitest-environment jsdom
 *
 * (DESPUÉS, no bloquea) El control de dominio inlineado en los scripts de la
 * agencia y del Pixel no acepta subdominios: staging.indiana.com.ar apuntado
 * a una copia de prueba mandaría contactos falsos a Ads y Meta.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { buildMarketingGtmSnippet } from "../gtmLoader";

beforeEach(() => {
  document.head.innerHTML = "<script></script>";
  window.dataLayer = [];
});

const carga = (hostname) => {
  document.head.innerHTML = "<script></script>";
  new Function("location", buildMarketingGtmSnippet("GTM-M2J2LBRD"))({ hostname });
  return !!document.querySelector('script[src*="GTM-M2J2LBRD"]');
};

describe("GTM de la agencia: dominio exacto", () => {
  it("carga en indiana.com.ar y www", () => {
    expect(carga("indiana.com.ar")).toBe(true);
    expect(carga("www.indiana.com.ar")).toBe(true);
  });

  it("no carga en subdominios ni en dominios que lo contienen", () => {
    expect(carga("staging.indiana.com.ar")).toBe(false);
    expect(carga("indiana.com.ar.evil.com")).toBe(false);
  });
});
