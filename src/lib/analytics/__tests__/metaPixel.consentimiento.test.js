/**
 * @vitest-environment jsdom
 *
 * El Pixel sigue la elección de PUBLICIDAD, no la de medición. Quien acepta
 * solo medición no le da permiso a Meta.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { buildMetaPixelSnippet } from "../metaPixel";
import { CONSENT_STORAGE_KEY } from "../consent";

function correr() {
  new Function("location", buildMetaPixelSnippet("870960458928397"))({ hostname: "www.indiana.com.ar" });
  return window.fbq.queue.map((args) => [...args]);
}

beforeEach(() => {
  delete window.fbq;
  delete window._fbq;
  document.head.innerHTML = "<script></script>";
  localStorage.clear();
});

describe("Pixel de Meta: qué permiso mira", () => {
  it("aceptó medición pero no publicidad: queda en pausa", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ads: false }));
    expect(correr()[0]).toEqual(["consent", "revoke"]);
  });

  it("aceptó publicidad pero no medición: carga sin pausa", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ads: true }));
    expect(correr()[0]).toEqual(["init", "870960458928397"]);
  });
});
