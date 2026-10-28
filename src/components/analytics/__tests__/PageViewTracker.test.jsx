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
const { persistConsent, CONSENT_STORAGE_KEY } = await import("@/lib/analytics/consent");
const { default: ItemViewTracker } = await import("../ItemViewTracker");
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

describe("PageViewTracker: aceptar las cookies después de la visita", () => {
  // Lo que se manda antes de aceptar sale sin cookies y no entra a los
  // informes; gtag no lo reenvía al aceptar (comprobado con red el 2026-10-26).
  const fichasVistas = () => window.dataLayer.filter((e) => e.event === "view_item");

  beforeEach(() => window.localStorage.clear());

  it("en una página común, vuelve a contar la visita al aceptar", () => {
    ir("/0km");
    document.title = "0km";
    render(<PageViewTracker />);
    asentar();
    act(() => persistConsent({ analytics: true, ads: true }));
    expect(visitas()).toHaveLength(2);
    expect(visitas()[1]).toMatchObject({ location: "okm_list", page_title: "0km" });
  });

  it("en una ficha, vuelve a contar la visita y el auto visto", () => {
    ir("/0km/208");
    document.title = "Peugeot 208";
    render(
      <>
        <PageViewTracker />
        <ItemViewTracker item={{ item_id: "208", item_name: "Peugeot 208", item_category: "0km" }} />
      </>,
    );
    asentar(0);
    act(() => persistConsent({ analytics: true, ads: true }));
    // el primero de cada uno salió sin cookies; el segundo es el que cuenta
    expect(visitas()).toHaveLength(2);
    expect(fichasVistas()).toHaveLength(2);
    expect(fichasVistas()[1]).toMatchObject({ item_id: "208", item_name: "Peugeot 208" });
  });

  it("el permiso llega a GTM antes que lo reenviado", () => {
    ir("/0km");
    render(<PageViewTracker />);
    asentar();
    act(() => persistConsent({ analytics: true, ads: true }));
    const iPermiso = window.dataLayer.findIndex(
      (e) => e[0] === "consent" && e[1] === "update" && e[2]?.analytics_storage === "granted",
    );
    const iReenvio = window.dataLayer.findLastIndex((e) => e.event === "page_view");
    expect(iPermiso).toBeGreaterThanOrEqual(0);
    expect(iPermiso).toBeLessThan(iReenvio);
  });

  it("con StrictMode (doble montaje) reenvía una sola vez", () => {
    ir("/0km");
    render(
      <StrictMode>
        <PageViewTracker />
      </StrictMode>,
    );
    asentar();
    act(() => persistConsent({ analytics: true, ads: true }));
    expect(visitas()).toHaveLength(2);
  });

  it("si acepta antes de que salga la visita, se cuenta una sola vez", () => {
    ir("/0km");
    render(<PageViewTracker />);
    act(() => persistConsent({ analytics: true, ads: true }));
    asentar();
    expect(visitas()).toHaveLength(1);
  });

  it("rechazar no reenvía nada", () => {
    ir("/0km");
    render(<PageViewTracker />);
    asentar();
    act(() => persistConsent({ analytics: false, ads: false }));
    expect(visitas()).toHaveLength(1);
  });

  it("si ya había aceptado antes, cambiar la elección no reenvía", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ analytics: true, ads: false, ts: 1 }),
    );
    ir("/0km");
    render(<PageViewTracker />);
    asentar();
    act(() => persistConsent({ analytics: true, ads: true }));
    expect(visitas()).toHaveLength(1);
  });
});

describe("PageViewTracker: el reenvío conserva la campaña de entrada", () => {
  // Quien llega de un anuncio, navega y recién después acepta: la sesión con
  // cookies arranca en el reenvío, y sin la campaña quedaba como orgánica o
  // directa (auditoría de analítica del 2026-10-26).
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("si navegó antes de aceptar, el reenvío lleva el gclid y los utm de la entrada", () => {
    ir("/0km?utm_source=google&utm_campaign=ofertas&gclid=abc123");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/planes");
    rerender(<PageViewTracker />);
    asentar();
    act(() => persistConsent({ analytics: true, ads: true }));
    const reenvio = new URL(visitas().at(-1).page_location);
    expect(reenvio.pathname).toBe("/planes");
    expect(reenvio.searchParams.get("gclid")).toBe("abc123");
    expect(reenvio.searchParams.get("utm_campaign")).toBe("ofertas");
  });

  it("las visitas normales no se tocan: la segunda página sale sin la campaña", () => {
    ir("/0km?gclid=abc123");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/planes");
    rerender(<PageViewTracker />);
    asentar();
    expect(new URL(visitas().at(-1).page_location).search).toBe("");
  });

  it("si la página actual ya trae campaña, gana la actual", () => {
    ir("/0km?utm_campaign=vieja");
    const { rerender } = render(<PageViewTracker />);
    asentar();
    ir("/planes?utm_campaign=nueva");
    rerender(<PageViewTracker />);
    asentar();
    act(() => persistConsent({ analytics: true, ads: true }));
    expect(new URL(visitas().at(-1).page_location).searchParams.get("utm_campaign")).toBe("nueva");
  });
});
