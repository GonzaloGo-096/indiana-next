/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { rememberEntryCampaign, withEntryCampaign, CAMPANA_VENCE_MS } from "../campanaEntrada";
import { persistConsent } from "../consent";

const ir = (p) => window.history.pushState({}, "", p);

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.dataLayer = [];
});
afterEach(() => vi.useRealTimers());

describe("campaña de entrada", () => {
  it("se suma a una dirección sin campaña", () => {
    ir("/0km?gclid=abc&utm_campaign=ofertas");
    rememberEntryCampaign();
    const u = new URL(withEntryCampaign("http://localhost:3000/planes"));
    expect(u.searchParams.get("gclid")).toBe("abc");
    expect(u.searchParams.get("utm_campaign")).toBe("ofertas");
  });

  it("solo guarda parámetros de campaña, no los demás", () => {
    ir("/usados?marca=Ford&utm_source=google");
    rememberEntryCampaign();
    const u = new URL(withEntryCampaign("http://localhost:3000/planes"));
    expect(u.searchParams.get("utm_source")).toBe("google");
    expect(u.searchParams.has("marca")).toBe(false);
  });

  it("vence a los 30 minutos: volver más tarde no hereda una campaña vieja", () => {
    vi.useFakeTimers();
    ir("/0km?gclid=abc");
    rememberEntryCampaign();
    vi.advanceTimersByTime(CAMPANA_VENCE_MS + 1);
    expect(withEntryCampaign("http://localhost:3000/planes")).toBe("http://localhost:3000/planes");
  });

  it("al rechazar la medición se borra (no queda el gclid guardado)", () => {
    ir("/0km?gclid=abc");
    rememberEntryCampaign();
    persistConsent({ analytics: false, ads: false });
    expect(withEntryCampaign("http://localhost:3000/planes")).toBe("http://localhost:3000/planes");
  });
});
