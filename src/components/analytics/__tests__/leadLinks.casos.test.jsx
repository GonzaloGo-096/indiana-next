/**
 * @vitest-environment jsdom
 *
 * Casos de borde de los links de contacto (auditoría QA del 2026-10-07): clic medio / modificadores, doble clic, prioridad item vs ficha,
 * navegación SPA entre fichas, StrictMode, TelLink sin teléfono.
 */
import React, { StrictMode } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import WhatsAppLink from "@/components/analytics/WhatsAppLink";
import TelLink from "@/components/analytics/TelLink";
import ItemViewTracker from "@/components/analytics/ItemViewTracker";
import { getPageItem, setPageItem } from "@/lib/analytics/pageItem";

const A = { item_id: "208", item_name: "Peugeot 208", item_category: "0km" };
const B = { item_id: "2008", item_name: "Peugeot 2008", item_category: "0km" };
const eventos = (n) => window.dataLayer.filter((e) => e.event === n);
const ir = (p) => window.history.pushState({}, "", p);

beforeEach(() => {
  window.dataLayer = [];
  ir("/0km/208");
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {}); // jsdom: "navigation to another Document"
});
afterEach(cleanup);

function wa(props = {}) {
  return render(
    <WhatsAppLink href="https://wa.me/1?text=Hola" componentId="x" aria-label="wa" {...props} />,
  ).getByLabelText("wa");
}

describe("WhatsAppLink: formas de abrir el link", () => {
  it("Ctrl/Cmd+clic y Shift+clic (pestaña/ventana nueva) también cuentan y llevan la referencia", () => {
    const a = wa();
    fireEvent.click(a, { ctrlKey: true });
    fireEvent.click(a, { metaKey: true });
    fireEvent.click(a, { shiftKey: true });
    expect(eventos("whatsapp_click")).toHaveLength(3);
    expect(new URL(a.href).searchParams.get("text")).toContain(`(Ref. web ${window.dataLayer[2].lead_ref})`);
  });

  it("clic medio (rueda del mouse): cuenta el contacto y abre el chat con su referencia", () => {
    const a = wa();
    fireEvent(a, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(eventos("whatsapp_click")).toHaveLength(1);
    expect(new URL(a.href).searchParams.get("text")).toContain(`(Ref. web ${eventos("whatsapp_click")[0].lead_ref})`);
  });

  it("clic medio real (apretar y soltar la ruedita): el link ya lleva la referencia al apretar, y es la misma del evento", () => {
    const a = wa();
    fireEvent.mouseDown(a, { button: 1 });
    const alApretar = new URL(a.href).searchParams.get("text");
    fireEvent(a, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    const [ev] = eventos("whatsapp_click");
    expect(alApretar).toContain(`(Ref. web ${ev.lead_ref})`);
    expect(eventos("whatsapp_click")).toHaveLength(1);
  });

  it("clic derecho (auxclick con button 2) no es un contacto", () => {
    const a = wa();
    fireEvent(a, new MouseEvent("auxclick", { bubbles: true, button: 2 }));
    expect(eventos("whatsapp_click")).toHaveLength(0);
  });

  it("es un <a href> real: Enter con foco dispara click en el navegador (jsdom no lo simula)", () => {
    const a = wa();
    expect(a.tagName).toBe("A");
    expect(a.getAttribute("href")).toBeTruthy();
    a.focus();
    expect(document.activeElement).toBe(a);
  });

  it("doble clic rápido: 2 whatsapp_click con referencias distintas (→ 2 generate_lead en el puente)", () => {
    const a = wa();
    fireEvent.click(a);
    fireEvent.click(a);
    fireEvent.doubleClick(a);
    const evs = eventos("whatsapp_click");
    expect(evs).toHaveLength(2);
    expect(evs[0].lead_ref).not.toBe(evs[1].lead_ref);
    // el href final es el del ÚLTIMO clic: el chat que se abre en último lugar
    expect(a.href).toContain(evs[1].lead_ref);
  });

  it("después de un clic el link vuelve al original: \"copiar enlace\" o \"abrir en pestaña nueva\" no reusan la referencia", () => {
    vi.useFakeTimers();
    try {
      const a = wa();
      fireEvent.click(a);
      const ref = window.dataLayer[0].lead_ref;
      expect(a.href).toContain(ref); // mientras el navegador lo abre
      vi.runAllTimers();
      expect(a.getAttribute("href")).toBe("https://wa.me/1?text=Hola");
    } finally {
      vi.useRealTimers();
    }
  });

  it("onClick del padre recibe el evento y corre después del track", () => {
    const orden = [];
    const onClick = vi.fn(() => orden.push(window.dataLayer.length));
    fireEvent.click(wa({ onClick }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(orden).toEqual([1]);
  });

  it("si el track falla, el link igual se abre con referencia y el onClick del padre corre", () => {
    window.dataLayer = { push: () => { throw new Error("roto"); } };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const onClick = vi.fn();
    const a = wa({ onClick });
    fireEvent.click(a);
    expect(onClick).toHaveBeenCalled();
    expect(a.href).toContain("Ref.%20web");
  });
});

describe("WhatsAppLink: qué auto viaja", () => {
  it("item explícito gana sobre el de la ficha", () => {
    setPageItem(B);
    fireEvent.click(wa({ item: A, itemFromPage: true }));
    expect(window.dataLayer[0]).toMatchObject(A);
  });

  it("sin itemFromPage, el auto de la ficha NO se usa (botones que no son de ficha)", () => {
    setPageItem(A);
    fireEvent.click(wa());
    expect(window.dataLayer[0].item_id).toBeUndefined();
  });

  it("navegación SPA entre fichas: el flotante manda el auto de la ficha actual, no el anterior", () => {
    const pagina = render(<ItemViewTracker item={A} />);
    pagina.unmount(); // Next remonta la página al cambiar el slug (sin cacheComponents)
    ir("/0km/2008");
    render(<ItemViewTracker item={B} />);
    fireEvent.click(wa({ itemFromPage: true, componentId: "whatsapp-floating" }));
    expect(eventos("view_item").map((e) => e.item_id)).toEqual(["208", "2008"]);
    expect(eventos("whatsapp_click")[0]).toMatchObject(B);
  });

  it("volver a la ficha anterior (back) vuelve a anotar su auto", () => {
    render(<ItemViewTracker item={A} />).unmount();
    ir("/0km/2008");
    render(<ItemViewTracker item={B} />).unmount();
    ir("/0km/208");
    render(<ItemViewTracker item={A} />);
    expect(getPageItem()).toEqual(A);
    expect(eventos("view_item")).toHaveLength(3);
  });

  it("caracteres especiales en la ruta (pathname codificado) no rompen el cruce ficha↔flotante", () => {
    ir("/usados/citroën-c3-2019-abc");
    render(<ItemViewTracker item={A} />);
    expect(getPageItem()).toEqual(A);
  });
});

describe("ItemViewTracker", () => {
  it("StrictMode (doble montaje en dev) manda un solo view_item", () => {
    render(
      <StrictMode>
        <ItemViewTracker item={A} />
      </StrictMode>,
    );
    expect(eventos("view_item")).toHaveLength(1);
  });

  it("si la misma instancia recibe OTRO auto, manda su view_item y cambia el auto del flotante", () => {
    // Hoy Next remonta la página por slug; esto cubre cacheComponents (Activity)
    // o un tracker movido a un layout.
    const { rerender } = render(<ItemViewTracker item={A} />);
    ir("/0km/2008");
    rerender(<ItemViewTracker item={B} />);
    rerender(<ItemViewTracker item={{ ...B }} />);
    expect(eventos("view_item").map((e) => e.item_id)).toEqual(["208", "2008"]);
    expect(getPageItem()).toEqual(B);
  });

  it("un item sin item_id no borra el auto anotado en la misma ruta (documenta)", () => {
    render(<ItemViewTracker item={A} />);
    render(<ItemViewTracker item={{ item_name: "sin id" }} />);
    expect(getPageItem()).toEqual(A);
  });
});

describe("TelLink", () => {
  it("+54 9 y espacios: conserva el + y solo dígitos", () => {
    const { getByLabelText } = render(<TelLink phone="+54 9 381 421-2000" componentId="x" aria-label="t" />);
    expect(getByLabelText("t").getAttribute("href")).toBe("tel:+5493814212000");
  });

  it("sin teléfono no hay href (no llama a nadie) y no cuenta como contacto", () => {
    const { container } = render(<TelLink phone="" componentId="footer-tel-x">Llamar</TelLink>);
    const a = container.querySelector("a");
    expect(a.hasAttribute("href")).toBe(false);
    fireEvent.click(a);
    expect(eventos("phone_click")).toHaveLength(0);
  });

  it("número numérico (no string) también arma el tel:", () => {
    const { getByLabelText } = render(<TelLink phone={3814212000} componentId="x" aria-label="t" />);
    expect(getByLabelText("t").getAttribute("href")).toBe("tel:3814212000");
  });
});
