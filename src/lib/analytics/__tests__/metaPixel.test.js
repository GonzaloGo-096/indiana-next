/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildMetaPixelSnippet } from "../metaPixel";
import { CONSENT_STORAGE_KEY, persistConsent } from "../consent";

/** Corre el cargador y devuelve los comandos que quedaron en la cola de fbq. */
function correr() {
  new Function(buildMetaPixelSnippet("870960458928397"))();
  return window.fbq.queue.map((args) => [...args]);
}

beforeEach(() => {
  delete window.fbq;
  delete window._fbq;
  document.head.innerHTML = "<script></script>";
  localStorage.clear();
  window.dataLayer = [];
});

describe("Pixel de Meta y consentimiento", () => {
  it("sin decisión todavía: queda en pausa antes de init y PageView", () => {
    expect(correr()).toEqual([
      ["consent", "revoke"],
      ["init", "870960458928397"],
      ["track", "PageView"],
    ]);
  });

  it("si la persona rechazó: queda en pausa", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: false, ads: false }));
    expect(correr()[0]).toEqual(["consent", "revoke"]);
  });

  it("si ya aceptó publicidad: carga como siempre, sin pausa", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ads: true }));
    expect(correr()).toEqual([
      ["init", "870960458928397"],
      ["track", "PageView"],
    ]);
  });

  it("si lo guardado está roto, queda en pausa", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "{roto");
    expect(correr()[0]).toEqual(["consent", "revoke"]);
  });

  it("aceptar en el banner prende el Pixel; rechazar lo apaga", () => {
    window.fbq = vi.fn();
    persistConsent({ analytics: true, ads: true });
    persistConsent({ analytics: true, ads: false });
    expect(window.fbq.mock.calls).toEqual([
      ["consent", "grant"],
      ["consent", "revoke"],
    ]);
  });

  it("sin Pixel cargado, el banner funciona igual", () => {
    expect(() => persistConsent({ analytics: true, ads: true })).not.toThrow();
  });
});
