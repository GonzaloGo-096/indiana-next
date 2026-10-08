/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { StrictMode } from "react";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const { default: PageViewTracker, SETTLE_MS, FICHA_MAX_MS } = await import("../PageViewTracker");
const { setPageItem, forgetPageItemUnless } = await import("@/lib/analytics/pageItem");
const asentar = (ms = SETTLE_MS) => act(() => vi.advanceTimersByTime(ms));
const ir = (path) => {
  nav.pathname = path.split("?")[0];
  window.history.pushState({}, "", path);
};
/** Lo que hace ItemViewTracker cuando la ficha real se arma. */
const fichaArmada = (item_id, title) => {
  if (title) document.title = title;
  act(() => setPageItem({ item_id }));
  asentar(0);
};

const visitas = () => window.dataLayer.filter((e) => e.event === "page_view");

beforeEach(() => {
  vi.useFakeTimers();
  window.dataLayer = [];
  forgetPageItemUnless("__ninguna__");
  document.title = "";
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
    fichaArmada("208");

    expect(visitas().map((e) => e.location)).toEqual(["home", "okm_detail"]);
    expect(visitas()[1].page_location).toBe("http://localhost:3000/0km/208");
  });

  it("en una ficha espera a que la ficha se arme, aunque tarde más que la espera común", () => {
    ir("/planes");
    document.title = "Planes";
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/planes/easy");
    rerender(<PageViewTracker />);
    asentar(3000); // el servidor tarda: todavía no se armó
    expect(visitas()).toHaveLength(1);

    fichaArmada("easy", "Plan Easy");
    expect(visitas()).toHaveLength(2);
    expect(visitas()[1].page_title).toBe("Plan Easy");
  });

  it("una redirección a la URL canónica es una sola visita, aunque el servidor tarde", () => {
    ir("/usados/vehiculos");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/usados/toyota-2009-abc");
    rerender(<PageViewTracker />);
    asentar(3000); // la ficha vieja nunca se arma: el servidor redirige
    ir("/usados/toyota-alpha-2009-abc");
    rerender(<PageViewTracker />);
    fichaArmada("abc", "Toyota");

    expect(visitas().map((e) => e.page_location)).toEqual([
      "http://localhost:3000/usados/vehiculos",
      "http://localhost:3000/usados/toyota-alpha-2009-abc",
    ]);
  });

  it("si la ficha no se arma (por ejemplo un 404), la visita se cuenta igual al tope", () => {
    ir("/0km/no-existe");
    render(<PageViewTracker />);
    asentar(FICHA_MAX_MS - 1);
    expect(visitas()).toHaveLength(0);
    asentar(1);
    expect(visitas()).toHaveLength(1);
  });

  it("si la ficha se arma antes de que el tracker la vea, cuenta enseguida y una sola vez", () => {
    ir("/0km/208");
    act(() => setPageItem({ item_id: "208" }));
    render(<PageViewTracker />);
    asentar(0);
    asentar(FICHA_MAX_MS);
    expect(visitas()).toHaveLength(1);
  });

  it("volver a una ficha ya vista espera a que se arme de nuevo (A → inicio → A)", () => {
    ir("/0km/208");
    const { rerender } = render(<PageViewTracker />);
    fichaArmada("208");
    ir("/");
    rerender(<PageViewTracker />);
    asentar();
    ir("/0km/208");
    rerender(<PageViewTracker />);
    asentar(0);
    expect(visitas()).toHaveLength(2); // todavía no se armó: el auto viejo no cuenta
    fichaArmada("208");
    expect(visitas()).toHaveLength(3);
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

  it("con StrictMode (doble montaje) sigue siendo una visita", () => {
    ir("/postventa");
    render(
      <StrictMode>
        <PageViewTracker />
      </StrictMode>,
    );
    asentar();
    expect(visitas()).toHaveLength(1);
  });

  it("toma el título que tiene la página al asentarse, no el de antes", () => {
    ir("/");
    document.title = "Inicio";
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/postventa");
    rerender(<PageViewTracker />);
    document.title = "Postventa";
    asentar();
    expect(visitas().map((e) => e.page_title)).toEqual(["Inicio", "Postventa"]);
  });

  it("al sacar un dato personal no reescribe el resto de la URL", () => {
    ir("/usados/vehiculos?utm_campaign=hola%20mundo&marca=peugeot,fiat&email=a%40b.com#arriba");
    render(<PageViewTracker />);
    asentar();
    expect(visitas()[0].page_location).toBe(
      "http://localhost:3000/usados/vehiculos?utm_campaign=hola%20mundo&marca=peugeot,fiat#arriba",
    );
  });

  it("no manda datos personales que vengan en la URL, pero sí la campaña", () => {
    ir("/postventa?utm_source=mail&email=juan@x.com&gclid=G1&telefono=381");
    render(<PageViewTracker />);
    asentar();
    expect(visitas()[0].page_location).toBe("http://localhost:3000/postventa?utm_source=mail&gclid=G1");
  });
});
