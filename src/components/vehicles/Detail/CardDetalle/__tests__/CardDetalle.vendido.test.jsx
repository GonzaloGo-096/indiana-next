/**
 * @vitest-environment jsdom
 *
 * Qué ofrece la ficha de detalle según el estado del auto.
 *
 * El botón de WhatsApp es el punto sensible: en un auto vendido, ofrecer
 * "contactar por este auto" manda al visitante a preguntar por algo que ya no
 * está. Lo que se fija acá es que el mensaje y el texto cambien, y que en un
 * auto disponible sigan siendo exactamente los de antes.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ alt }) => <img alt={alt} />,
}));

vi.mock("@/components/vehicles/ImageCarousel/ImageCarousel", () => ({
  ImageCarousel: () => <div data-testid="carrusel" />,
}));

vi.mock("@/components/vehicles/GalleryModal/GalleryModal", () => ({
  GalleryModal: () => null,
}));

vi.mock("@/components/analytics/WhatsAppLink", () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} data-testid="whatsapp" {...props}>
      {children}
    </a>
  ),
}));

const { CardDetalle } = await import("../CardDetalle");

afterEach(cleanup);

const auto = (extra = {}) => ({
  _id: "6a883dc43f2970e04f4edfeb",
  marca: "Peugeot",
  modelo: "208",
  version: "Allure",
  anio: 2025,
  kilometraje: 14000,
  caja: "Manual",
  precio: 28000000,
  precioOferta: 28000000,
  ...extra,
});

const mensaje = () =>
  decodeURIComponent(screen.getByTestId("whatsapp").getAttribute("href"));

describe("CardDetalle — auto vendido", () => {
  it("muestra el sello de vendido", () => {
    render(<CardDetalle auto={auto({ estado: "VENDIDO" })} />);
    expect(screen.getByText("Vendido")).toBeTruthy();
  });

  it("el botón deja de ofrecer este auto y ofrece similares", () => {
    render(<CardDetalle auto={auto({ estado: "VENDIDO" })} />);
    expect(screen.getByText("Consultar unidades similares")).toBeTruthy();
    expect(mensaje()).toContain("figura como vendido");
    expect(mensaje()).toContain("unidades similares");
  });

  it("el mensaje de vendido no incluye el precio", () => {
    render(<CardDetalle auto={auto({ estado: "VENDIDO" })} />);
    expect(mensaje()).not.toContain("28.000.000");
  });
});

describe("CardDetalle — auto disponible (no cambia nada)", () => {
  it("un auto sin estado mantiene el botón de siempre", () => {
    render(<CardDetalle auto={auto()} />);
    expect(screen.getByText("Contactar por WhatsApp")).toBeTruthy();
    expect(screen.queryByText("Vendido")).toBeNull();
  });

  it("y el mensaje de siempre, con el auto y el precio", () => {
    render(<CardDetalle auto={auto()} />);
    expect(mensaje()).toContain("Me interesa el Peugeot 208 Allure");
    expect(mensaje()).toContain("28.000.000");
  });
});
