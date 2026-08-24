/**
 * @vitest-environment jsdom
 *
 * Pruebas de caracterización del acordeón del footer.
 *
 * Fijan cómo abre y cierra hoy, para que el rewrite no cambie la interacción
 * sin que se note. El acordeón se mantiene también en escritorio: eso es a
 * propósito y está dicho en la regla de 992px del CSS.
 *
 * Los dos pendientes que este archivo llevaba marcados con `it.fails` ya se
 * cobraron solos: el panel cerrado salió del recorrido de teclado y el
 * aria-expanded se declara desde el arranque. Los dos casos quedaron como
 * pruebas normales.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/lib/analytics/dataLayer", () => ({
  pushDataLayer: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }) => <img alt={alt} src={src} />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const Footer = (await import("@/components/layout/Footer")).default;

afterEach(cleanup);

const MODULOS = [
  "Peugeot oficial | 0 km",
  "Multimarca | Usados",
  "Posventa / Taller",
];

describe("acordeón del footer", () => {
  it("declara aria-expanded=false desde el arranque", () => {
    const { getByRole } = render(<Footer />);

    // Sin esto el botón no se anuncia como desplegable hasta que alguien lo
    // toca: el estado arrancaba en undefined y React omite los aria-* con ese
    // valor.
    for (const nombre of MODULOS) {
      const boton = getByRole("button", { name: nombre });
      expect(boton.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("abre y cierra el módulo al hacer clic", () => {
    const { getByRole } = render(<Footer />);
    const boton = getByRole("button", { name: "Multimarca | Usados" });

    fireEvent.click(boton);
    expect(boton.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(boton);
    expect(boton.getAttribute("aria-expanded")).toBe("false");
  });

  it("deja abrir varios módulos a la vez", () => {
    const { getByRole } = render(<Footer />);

    for (const nombre of MODULOS) {
      fireEvent.click(getByRole("button", { name: nombre }));
    }

    for (const nombre of MODULOS) {
      const boton = getByRole("button", { name: nombre });
      expect(boton.getAttribute("aria-expanded")).toBe("true");
    }
  });

  it("apunta cada botón a su panel con aria-controls", () => {
    const { getByRole, container } = render(<Footer />);

    for (const nombre of MODULOS) {
      const boton = getByRole("button", { name: nombre });
      const id = boton.getAttribute("aria-controls");
      expect(id).toBeTruthy();
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    }
  });

  it("tiene el segundo nivel solo en Peugeot, que es el que tiene dos sedes", () => {
    const { getByRole, queryByRole } = render(<Footer />);

    // Usados y Posventa muestran sus íconos directo, sin acordeón anidado.
    // Esto es lo que hace que la rama del componente siga existiendo después
    // de unificar la forma de los datos.
    expect(queryByRole("button", { name: "Sede San Miguel de Tucumán" })).toBeTruthy();
    expect(queryByRole("button", { name: "Sede Yerba Buena - Tucumán" })).toBeTruthy();

    const sede = getByRole("button", { name: "Sede San Miguel de Tucumán" });
    expect(sede.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(sede);
    expect(sede.getAttribute("aria-expanded")).toBe("true");
  });

  it("mantiene las sedes cerradas aunque se abra el módulo que las contiene", () => {
    const { getByRole } = render(<Footer />);

    fireEvent.click(getByRole("button", { name: "Peugeot oficial | 0 km" }));

    const sede = getByRole("button", { name: "Sede San Miguel de Tucumán" });
    expect(sede.getAttribute("aria-expanded")).toBe("false");
  });

  it("no deja los enlaces del panel cerrado en el recorrido de teclado", () => {
    const { container } = render(<Footer />);

    // Todo cerrado: ningún enlace de contacto puede recibir el foco. Antes el
    // panel se cerraba solo con `max-height: 0`, así que los 16 enlaces
    // seguían siendo enfocables y el foco desaparecía de la pantalla.
    const enlacesOcultos = [...container.querySelectorAll("a[href]")].filter(
      (a) => {
        const href = a.getAttribute("href");
        return (
          href.startsWith("tel:") ||
          href.startsWith("https://api.whatsapp.com") ||
          href.startsWith("https://maps.google.com") ||
          href.startsWith("https://instagram.com")
        );
      },
    );

    expect(enlacesOcultos).toHaveLength(16);
    for (const enlace of enlacesOcultos) {
      expect(enlace.closest("[inert]")).not.toBeNull();
    }
  });

});
