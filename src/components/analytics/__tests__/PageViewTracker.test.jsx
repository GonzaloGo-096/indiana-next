/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const { default: PageViewTracker } = await import("../PageViewTracker");

const visitas = () => window.dataLayer.filter((e) => e.event === "page_view");

beforeEach(() => {
  window.dataLayer = [];
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(cleanup);

describe("PageViewTracker", () => {
  it("cuenta la primera página y cada cambio de página, una vez cada una", () => {
    nav.pathname = "/";
    window.history.pushState({}, "", "/");
    const { rerender } = render(<PageViewTracker />);
    rerender(<PageViewTracker />);

    nav.pathname = "/0km/208";
    window.history.pushState({}, "", "/0km/208");
    rerender(<PageViewTracker />);

    expect(visitas().map((e) => e.location)).toEqual(["home", "okm_detail"]);
    expect(visitas()[1].page_location).toBe("http://localhost:3000/0km/208");
  });

  it("filtrar (cambia la query, no la ruta) no es otra visita", () => {
    nav.pathname = "/usados/vehiculos";
    window.history.pushState({}, "", "/usados/vehiculos");
    const { rerender } = render(<PageViewTracker />);

    window.history.pushState({}, "", "/usados/vehiculos?marca=Ford");
    rerender(<PageViewTracker />);

    expect(visitas()).toHaveLength(1);
  });
});
