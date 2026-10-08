/**
 * @vitest-environment jsdom
 *
 * Casos de borde de las visitas (auditoría QA del 2026-10-07): StrictMode, page_title (ningún test lo verifica), desmontaje antes
 * de asentar, ida y vuelta rápida, volver a una página ya vista, ruta nula.
 */
import React, { StrictMode } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const { default: PageViewTracker, SETTLE_MS } = await import("@/components/analytics/PageViewTracker");

const asentar = (ms = SETTLE_MS) => act(() => vi.advanceTimersByTime(ms));
const ir = (path) => {
  nav.pathname = path === null ? null : path.split("?")[0];
  if (path) window.history.pushState({}, "", path);
};
const visitas = () => window.dataLayer.filter((e) => e.event === "page_view");

beforeEach(() => {
  vi.useFakeTimers();
  window.dataLayer = [];
  document.title = "";
  vi.spyOn(console, "debug").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PageViewTracker (propuestos)", () => {
  it("StrictMode (doble efecto en dev) cuenta una sola visita", () => {
    ir("/");
    render(
      <StrictMode>
        <PageViewTracker />
      </StrictMode>,
    );
    asentar();
    expect(visitas()).toHaveLength(1);
  });

  it("toma el título que tiene la página al asentarse, no el del momento del cambio", () => {
    ir("/postventa");
    document.title = "Indiana";
    render(<PageViewTracker />);
    act(() => vi.advanceTimersByTime(SETTLE_MS - 1));
    document.title = "Postventa | Peugeot Indiana";
    asentar(1);
    expect(visitas()[0].page_title).toBe("Postventa | Peugeot Indiana");
  });

  it("no manda nada antes de los 500 ms", () => {
    ir("/planes");
    render(<PageViewTracker />);
    asentar(SETTLE_MS - 1);
    expect(visitas()).toHaveLength(0);
  });

  it("si se desmonta antes de asentarse, no manda la visita", () => {
    ir("/planes");
    const r = render(<PageViewTracker />);
    r.unmount();
    asentar();
    expect(visitas()).toHaveLength(0);
  });

  it("A → B → A en menos de medio segundo: una sola visita (A)", () => {
    ir("/");
    const { rerender } = render(<PageViewTracker />);
    ir("/0km");
    rerender(<PageViewTracker />);
    ir("/");
    rerender(<PageViewTracker />);
    asentar();
    expect(visitas().map((e) => e.location)).toEqual(["home"]);
  });

  it("volver a una página ya vista (A → B → A, asentando) cuenta 3 visitas", () => {
    ir("/");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/0km");
    rerender(<PageViewTracker />);
    asentar();
    ir("/");
    rerender(<PageViewTracker />);
    asentar();
    expect(visitas().map((e) => e.location)).toEqual(["home", "okm_list", "home"]);
  });

  it("page_location incluye la query (utm, gclid) para que GA4 atribuya la campaña", () => {
    ir("/usados/vehiculos?utm_source=google&gclid=abc");
    render(<PageViewTracker />);
    asentar();
    expect(visitas()[0].page_location).toContain("gclid=abc");
  });

  it("sin ruta (usePathname null) no manda nada", () => {
    ir(null);
    render(<PageViewTracker />);
    asentar();
    expect(visitas()).toHaveLength(0);
  });

  it("page_view vacía el auto de la ficha anterior (no queda pegado en GTM)", () => {
    window.dataLayer.push({ event: "view_item", item_id: "208" });
    ir("/");
    render(<PageViewTracker />);
    asentar();
    const v = visitas()[0];
    expect(Object.prototype.hasOwnProperty.call(v, "item_id")).toBe(true);
    expect(v.item_id).toBeUndefined();
  });
});
