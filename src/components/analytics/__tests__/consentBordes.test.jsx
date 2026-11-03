/**
 * @vitest-environment jsdom
 *
 * Bordes del consentimiento hallados en la auditoría QA del 2026-10-26.
 * Los dos bugs (banner que no se cierra con localStorage bloqueado y permiso
 * que no llega a GTM al aceptar en otra pestaña) se arreglaron el mismo día.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import ConsentBanner from "../ConsentBanner";
import { CONSENT_STORAGE_KEY, clearStoredConsent, onAnalyticsGranted, updateConsent } from "@/lib/analytics/consent";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearStoredConsent(); // también lo recordado en memoria
  localStorage.clear();
});

const permisoGranted = () =>
  window.dataLayer.some(
    (e) => e && e[0] === "consent" && e[1] === "update" && e[2]?.analytics_storage === "granted",
  );

function bloquearStorage() {
  const bloqueado = () => {
    throw new Error("SecurityError");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(bloqueado);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(bloqueado);
}

describe("localStorage bloqueado (Firefox con cookies bloqueadas, WebView sin DOM storage)", () => {
  it("Aceptar aplica el permiso en GTM aunque no se pueda guardar", () => {
    window.dataLayer = [];
    bloquearStorage();
    const { getByText } = render(<ConsentBanner />);
    fireEvent.click(getByText("Aceptar todas"));
    expect(permisoGranted()).toBe(true);
  });

  it("Aceptar cierra el banner aunque no se pueda guardar", () => {
    window.dataLayer = [];
    bloquearStorage();
    const { getByText, queryByRole } = render(<ConsentBanner />);
    fireEvent.click(getByText("Aceptar todas"));
    expect(queryByRole("dialog")).toBeNull();
  });
});

describe("varias pestañas", () => {
  function aceptarEnOtraPestana() {
    const v = JSON.stringify({ analytics: true, ads: true, ts: Date.now() });
    act(() => {
      localStorage.setItem(CONSENT_STORAGE_KEY, v);
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_STORAGE_KEY, newValue: v }));
    });
  }

  it("aceptar en otra pestaña cierra el banner en esta", () => {
    window.dataLayer = [];
    const { queryByRole } = render(<ConsentBanner />);
    aceptarEnOtraPestana();
    expect(queryByRole("dialog")).toBeNull();
  });

  it("aceptar en otra pestaña aplica el permiso en el GTM de esta", () => {
    window.dataLayer = [];
    render(<ConsentBanner />);
    aceptarEnOtraPestana();
    expect(permisoGranted()).toBe(true);
  });
});

describe("varias pestañas: reenvío", () => {
  it("si la medición pasa a aceptada desde otra pestaña, avisa una vez para reenviar la página", () => {
    window.dataLayer = [];
    updateConsent({ analytics: false, ads: false }); // esta página arrancó sin decisión
    const aviso = vi.fn();
    const dejar = onAnalyticsGranted(aviso);
    render(<ConsentBanner />);
    const v = JSON.stringify({ analytics: true, ads: true, ts: Date.now() });
    act(() => {
      localStorage.setItem(CONSENT_STORAGE_KEY, v);
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_STORAGE_KEY, newValue: v }));
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_STORAGE_KEY, newValue: v }));
    });
    expect(aviso).toHaveBeenCalledTimes(1);
    dejar();
  });
});
