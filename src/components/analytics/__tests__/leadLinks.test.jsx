/**
 * @vitest-environment jsdom
 *
 * Cada contacto se cuenta UNA vez. Antes un clic de WhatsApp mandaba
 * whatsapp_click y generate_lead, y los leads salían duplicados.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import WhatsAppLink from "../WhatsAppLink";
import TelLink from "../TelLink";
import ItemViewTracker from "../ItemViewTracker";

const ITEM = { item_id: "208", item_name: "Peugeot 208", item_category: "0km" };

beforeEach(() => {
  window.dataLayer = [];
  window.history.pushState({}, "", "/0km/208");
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterEach(cleanup);

describe("WhatsAppLink", () => {
  const REF = /^[A-HJ-NP-Z2-9]{5}$/;

  it("un clic = un solo whatsapp_click, con el botón, el auto y una referencia", () => {
    const { getByText } = render(
      <WhatsAppLink href="https://wa.me/1?text=Hola" componentId="whatsapp-detalle-0km" item={ITEM}>
        Contactanos por WhatsApp
      </WhatsAppLink>,
    );
    fireEvent.click(getByText("Contactanos por WhatsApp"));
    expect(window.dataLayer).toHaveLength(1);
    const ev = window.dataLayer[0];
    expect(ev).toMatchObject({
      event: "whatsapp_click",
      location: "okm_detail",
      component_id: "whatsapp-detalle-0km",
      ...ITEM,
    });
    expect(ev.lead_ref).toMatch(REF);
  });

  it("la referencia del evento es la misma que viaja en el mensaje", () => {
    const { getByText } = render(
      <WhatsAppLink href="https://wa.me/1?text=Hola%2C%20quiero%20info" componentId="x">
        Contactar por WhatsApp
      </WhatsAppLink>,
    );
    const a = getByText("Contactar por WhatsApp").closest("a");
    fireEvent.click(a);
    const texto = new URL(a.href).searchParams.get("text");
    expect(texto).toBe(`Hola, quiero info

(Ref. web ${window.dataLayer[0].lead_ref})`);
  });

  it("cada clic tiene su propia referencia", () => {
    const { getByText } = render(<WhatsAppLink href="https://wa.me/1" componentId="x">wa</WhatsAppLink>);
    fireEvent.click(getByText("wa"));
    fireEvent.click(getByText("wa"));
    expect(window.dataLayer[0].lead_ref).not.toBe(window.dataLayer[1].lead_ref);
  });

  it("el flotante toma el auto de la ficha abierta, y solo en esa ficha", () => {
    render(<ItemViewTracker item={ITEM} />);
    const { getByLabelText } = render(
      <WhatsAppLink href="https://wa.me/1" componentId="whatsapp-floating" itemFromPage aria-label="wa" />,
    );
    fireEvent.click(getByLabelText("wa"));
    expect(window.dataLayer[1]).toMatchObject({ component_id: "whatsapp-floating", ...ITEM });

    window.history.pushState({}, "", "/");
    fireEvent.click(getByLabelText("wa"));
    expect(window.dataLayer[2].item_id).toBeUndefined();
    expect(window.dataLayer[2].location).toBe("home");
  });

  it("sin auto ni ficha manda solo el botón", () => {
    const { getByLabelText } = render(
      <WhatsAppLink href="https://wa.me/1" componentId="whatsapp-floating" aria-label="wa" />,
    );
    fireEvent.click(getByLabelText("wa"));
    expect(window.dataLayer[0]).toMatchObject({ event: "whatsapp_click", component_id: "whatsapp-floating" });
    expect(window.dataLayer[0].item_id).toBeUndefined();
  });

  it("no cambia el texto del botón ni cómo se abre", () => {
    const { getByText } = render(
      <WhatsAppLink href="https://wa.me/1" componentId="x">
        Contactar por WhatsApp
      </WhatsAppLink>,
    );
    const a = getByText("Contactar por WhatsApp").closest("a");
    expect(a.getAttribute("href")).toBe("https://wa.me/1");
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.textContent).toBe("Contactar por WhatsApp");
  });
});

describe("TelLink", () => {
  it("un clic = un solo phone_click, y arma el tel: limpio", () => {
    const { getByLabelText } = render(
      <TelLink phone="(0381) 421-2000" componentId="footer-tel-peugeot-san-miguel" aria-label="tel" />,
    );
    const a = getByLabelText("tel");
    expect(a.getAttribute("href")).toBe("tel:03814212000");
    fireEvent.click(a);
    expect(window.dataLayer).toEqual([
      { event: "phone_click", location: "okm_detail", component_id: "footer-tel-peugeot-san-miguel" },
    ]);
  });
});

describe("ItemViewTracker", () => {
  it("manda view_item una sola vez aunque se vuelva a renderizar", () => {
    const { rerender } = render(<ItemViewTracker item={ITEM} />);
    rerender(<ItemViewTracker item={{ ...ITEM }} />);
    expect(window.dataLayer).toEqual([{ event: "view_item", location: "okm_detail", ...ITEM }]);
  });

  it("sin item no manda nada", () => {
    render(<ItemViewTracker item={null} />);
    expect(window.dataLayer).toEqual([]);
  });
});
