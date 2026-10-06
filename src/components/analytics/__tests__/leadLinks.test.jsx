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
  it("un clic = un solo whatsapp_click, con el botón y el auto", () => {
    const { getByText } = render(
      <WhatsAppLink href="https://wa.me/1" componentId="whatsapp-detalle-0km" item={ITEM}>
        Contactanos por WhatsApp
      </WhatsAppLink>,
    );
    fireEvent.click(getByText("Contactanos por WhatsApp"));
    expect(window.dataLayer).toEqual([
      {
        event: "whatsapp_click",
        location: "okm_detail",
        component_id: "whatsapp-detalle-0km",
        ...ITEM,
      },
    ]);
  });

  it("sin auto manda solo el botón", () => {
    const { getByLabelText } = render(
      <WhatsAppLink href="https://wa.me/1" componentId="whatsapp-floating" aria-label="wa" />,
    );
    fireEvent.click(getByLabelText("wa"));
    expect(window.dataLayer).toEqual([
      { event: "whatsapp_click", location: "okm_detail", component_id: "whatsapp-floating" },
    ]);
  });

  it("no cambia el link: abre en pestaña nueva y respeta el texto", () => {
    const { getByText } = render(
      <WhatsAppLink href="https://wa.me/1" componentId="x">
        Contactar por WhatsApp
      </WhatsAppLink>,
    );
    const a = getByText("Contactar por WhatsApp").closest("a");
    expect(a.getAttribute("href")).toBe("https://wa.me/1");
    expect(a.getAttribute("target")).toBe("_blank");
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
