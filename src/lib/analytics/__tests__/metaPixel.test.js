/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildMetaPixelSnippet } from "../metaPixel";
import { CONSENT_STORAGE_KEY, persistConsent } from "../consent";

/**
 * Corre el cargador en el dominio indicado (jsdom siempre es "localhost") y
 * devuelve los comandos que quedaron en la cola de fbq.
 */
function correr(hostname = "www.indiana.com.ar") {
  new Function("location", buildMetaPixelSnippet("870960458928397"))({ hostname });
  return window.fbq ? window.fbq.queue.map((args) => [...args]) : null;
}

beforeEach(() => {
  delete window.fbq;
  delete window._fbq;
  document.head.innerHTML = "<script></script>";
  localStorage.clear();
  window.dataLayer = [];
});

describe("Pixel de Meta: solo en el sitio real", () => {
  // Meta no tiene marca de prueba: una prueba en una copia llegaría a la
  // agencia como una visita real.
  it("en una copia de prueba de Vercel o en local no carga", () => {
    expect(correr("indiana-next-abc-gonzalos-projects.vercel.app")).toBeNull();
    expect(correr("localhost")).toBeNull();
    expect(document.querySelector('script[src*="fbevents.js"]')).toBeNull();
  });
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

  it("si acepta antes de que baje el script de Meta, el grant se manda cuando el script carga", () => {
    vi.useFakeTimers();
    try {
      correr(); // cola con revoke, init, PageView; fbevents.js todavía no cargó
      persistConsent({ analytics: true, ads: true });
      expect(window.fbq.queue.map((a) => [...a])).not.toContainEqual(["consent", "grant"]);
      // carga el script: Meta reemplaza la cola por callMethod
      const llamadas = [];
      window.fbq.callMethod = (...a) => llamadas.push(a);
      const fbqViejo = window.fbq;
      window.fbq = (...a) => fbqViejo.callMethod(...a);
      window.fbq.callMethod = fbqViejo.callMethod;
      vi.advanceTimersByTime(400);
      expect(llamadas).toContainEqual(["consent", "grant"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("sin Pixel cargado, el banner funciona igual", () => {
    expect(() => persistConsent({ analytics: true, ads: true })).not.toThrow();
  });
});
