/**
 * @vitest-environment jsdom
 *
 * Cómo se ve una ficha según el estado del auto.
 *
 * Lo que se fija acá es que un auto vendido NO pueda leerse como disponible: es
 * la razón de ser del cambio. Y sobre todo que un auto SIN estado siga viéndose
 * como siempre, porque hasta que el backend de producción despliegue el campo,
 * los 44 autos reales llegan sin él.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ alt, className }) => <img alt={alt} className={className} />,
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

const { CardAuto } = await import("../CardAuto");

// El proyecto no tiene cleanup automatico entre tests: sin esto los render se
// acumulan en el mismo documento y las consultas encuentran fichas de mas.
afterEach(cleanup);

const auto = (extra = {}) => ({
  _id: "6a883dc43f2970e04f4edfeb",
  marca: "Peugeot",
  modelo: "208",
  anio: 2025,
  kilometraje: 14000,
  caja: "Manual",
  precio: 28000000,
  precioOferta: 28000000,
  ...extra,
});

describe("CardAuto según el estado", () => {
  it("un auto vendido muestra la cinta", () => {
    render(<CardAuto auto={auto({ estado: "VENDIDO" })} />);
    expect(screen.getByTestId("sold-ribbon")).toBeTruthy();
  });

  it("un auto sin estado no muestra la cinta", () => {
    render(<CardAuto auto={auto()} />);
    expect(screen.queryByTestId("sold-ribbon")).toBeNull();
  });

  it("un auto activo tampoco", () => {
    render(<CardAuto auto={auto({ estado: "ACTIVO" })} />);
    expect(screen.queryByTestId("sold-ribbon")).toBeNull();
  });

  it("el estado queda en el DOM para el resto del sitio", () => {
    render(<CardAuto auto={auto({ estado: "VENDIDO" })} />);
    expect(screen.getByTestId("vehicle-card").dataset.estado).toBe("VENDIDO");
  });

  it("un auto sin estado queda marcado como ACTIVO", () => {
    render(<CardAuto auto={auto()} />);
    expect(screen.getByTestId("vehicle-card").dataset.estado).toBe("ACTIVO");
  });

  it("un vendido con descuento no muestra el badge de Oportunidad", () => {
    render(
      <CardAuto auto={auto({ estado: "VENDIDO", precioOferta: 25000000 })} />
    );
    expect(screen.queryByText("Oportunidad")).toBeNull();
  });

  it("pero un auto disponible con descuento sí lo muestra", () => {
    render(<CardAuto auto={auto({ precioOferta: 25000000 })} />);
    expect(screen.getByText("Oportunidad")).toBeTruthy();
  });

  it("el aria-label avisa que está vendido", () => {
    render(<CardAuto auto={auto({ estado: "VENDIDO" })} />);
    expect(
      screen.getByLabelText("Ver detalles de Peugeot 208 (vendido)")
    ).toBeTruthy();
  });
});
