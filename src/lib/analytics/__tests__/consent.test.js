/**
 * @vitest-environment jsdom
 *
 * Archivo propio: el recuerdo en memoria de consent.js dura lo que dura el
 * módulo, y acá se prueba con localStorage bloqueado.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { onAnalyticsGranted, persistConsent } from "../consent";

afterEach(() => vi.restoreAllMocks());

describe("onAnalyticsGranted con localStorage bloqueado (modo privado)", () => {
  it("avisa una sola vez aunque la persona acepte de nuevo", () => {
    window.dataLayer = [];
    const bloqueado = () => {
      throw new Error("SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(bloqueado);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(bloqueado);
    const aviso = vi.fn();
    const dejar = onAnalyticsGranted(aviso);

    persistConsent({ analytics: true, ads: true });
    persistConsent({ analytics: true, ads: true });

    expect(aviso).toHaveBeenCalledTimes(1);
    dejar();
  });
});
