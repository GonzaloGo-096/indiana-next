/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const { default: PageViewTracker, SETTLE_MS } = await import("../PageViewTracker");
const asentar = () => act(() => vi.advanceTimersByTime(SETTLE_MS));
const ir = (path) => {
  nav.pathname = path.split("?")[0];
  window.history.pushState({}, "", path);
};

const visitas = () => window.dataLayer.filter((e) => e.event === "page_view");

beforeEach(() => {
  vi.useFakeTimers();
  window.dataLayer = [];
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PageViewTracker", () => {
  it("cuenta la primera página y cada cambio de página, una vez cada una", () => {
    ir("/");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    rerender(<PageViewTracker />);
    asentar();

    ir("/0km/208");
    rerender(<PageViewTracker />);
    asentar();

    expect(visitas().map((e) => e.location)).toEqual(["home", "okm_detail"]);
    expect(visitas()[1].page_location).toBe("http://localhost:3000/0km/208");
  });

  it("una redirección a la URL canónica es una sola visita", () => {
    ir("/usados/toyota-2009-abc");
    const { rerender } = render(<PageViewTracker />);
    ir("/usados/toyota-alpha-2009-abc");
    rerender(<PageViewTracker />);
    asentar();

    expect(visitas()).toHaveLength(1);
    expect(visitas()[0].page_location).toBe("http://localhost:3000/usados/toyota-alpha-2009-abc");
  });

  it("filtrar (cambia la query, no la ruta) no es otra visita", () => {
    ir("/usados/vehiculos");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/usados/vehiculos?marca=Ford");
    rerender(<PageViewTracker />);
    asentar();

    expect(visitas()).toHaveLength(1);
  });
});
