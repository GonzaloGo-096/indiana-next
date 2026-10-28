/**
 * @vitest-environment jsdom
 *
 * Cableado de la medición en el armazón del sitio: que las piezas que miden
 * estén montadas donde corresponde. Los componentes ya tienen sus tests; esto
 * cubre que alguien los saque del lugar sin darse cuenta (simulación de
 * errores del 2026-10-27: sacarlos no rompía ningún test).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));
// El resto del armazón no mide nada: afuera, para que el test no dependa de él.
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/components/layout/Nav", () => ({ default: () => null }));
vi.mock("@/components/layout/Footer/FooterLazy", () => ({ default: () => null }));
vi.mock("@/components/layout/ClientOnlyComponents", () => ({ default: () => null }));
vi.mock("@/components/tracking/MarketingTracking", () => ({ default: () => null }));

const { default: PublicSiteChrome } = await import("../PublicSiteChrome");
const { default: FloatingWhatsAppButton } = await import("../FloatingWhatsApp/FloatingWhatsAppButton");
const { SETTLE_MS } = await import("@/components/analytics/PageViewTracker");
const { setPageItem, forgetPageItemUnless } = await import("@/lib/analytics/pageItem");

const ir = (path) => {
  nav.pathname = path;
  window.history.pushState({}, "", path);
};

beforeEach(() => {
  window.dataLayer = [];
  forgetPageItemUnless("__ninguna__");
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("armazón público", () => {
  it("cuenta la visita de cualquier página del sitio", () => {
    vi.useFakeTimers();
    ir("/postventa");
    render(<PublicSiteChrome><p>contenido</p></PublicSiteChrome>);
    act(() => vi.advanceTimersByTime(SETTLE_MS));
    const visitas = window.dataLayer.filter((e) => e.event === "page_view");
    expect(visitas).toHaveLength(1);
    expect(visitas[0].location).toBe("postventa");
  });
});

describe("WhatsApp flotante", () => {
  it("en una ficha manda el auto de la ficha abierta", () => {
    ir("/0km/208");
    setPageItem({ item_id: "208", item_name: "Peugeot 208", item_category: "0km" });
    const { getByRole } = render(<FloatingWhatsAppButton />);
    fireEvent.click(getByRole("link"));
    const clic = window.dataLayer.find((e) => e.event === "whatsapp_click");
    expect(clic.component_id).toBe("whatsapp-floating");
    expect(clic.item_id).toBe("208");
  });
});
