/**
 * @vitest-environment jsdom
 *
 * Pruebas de caracterización del acordeón del footer.
 *
 * Fijan cómo abre y cierra hoy, para que el rewrite no cambie la interacción
 * sin que se note. El acordeón se mantiene también en escritorio: eso es a
 * propósito y está dicho en la regla de 992px del CSS.
 *
 * Los dos últimos casos son distintos: describen cómo DEBERÍA comportarse el
 * acordeón y hoy fallan. Están marcados con `it.fails` para no romper la puerta
 * de calidad. Uno es el hallazgo B1 —el panel cerrado sigue siendo enfocable—;
 * el otro apareció escribiendo estas pruebas: el `aria-expanded` no existe
 * hasta el primer clic, porque el estado arranca en undefined y React omite los
 * aria-* con ese valor.
 *
 * `it.fails` es a propósito y no `it.todo`: cuando se arreglen, estos casos van
 * a empezar a fallar y obligan a convertirlos en `it` normales. Un pendiente
 * que se cobra solo.
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
  it("arranca sin declarar aria-expanded, hasta el primer clic", () => {
    const { getByRole } = render(<Footer />);

    // El estado inicial es `openModules[id]`, o sea undefined, y React omite
    // los aria-* con valor undefined. Resultado: el boton no se anuncia como
    // desplegable hasta que alguien lo toca. Se arregla junto con B2; mientras
    // tanto queda fijado para que el rewrite no lo empeore sin querer.
    for (const nombre of MODULOS) {
      const boton = getByRole("button", { name: nombre });
      expect(boton.hasAttribute("aria-expanded")).toBe(false);
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
    expect(sede.hasAttribute("aria-expanded")).toBe(false);

    fireEvent.click(sede);
    expect(sede.getAttribute("aria-expanded")).toBe("true");
  });

  it("mantiene las sedes cerradas aunque se abra el módulo que las contiene", () => {
    const { getByRole } = render(<Footer />);

    fireEvent.click(getByRole("button", { name: "Peugeot oficial | 0 km" }));

    const sede = getByRole("button", { name: "Sede San Miguel de Tucumán" });
    expect(sede.hasAttribute("aria-expanded")).toBe(false);
  });

  // ---------------------------------------------------------------------
  // Pendientes: se arreglan en el rewrite y ahi estos pasan a `it` normal
  // ---------------------------------------------------------------------

  it.fails("declara aria-expanded=false desde el arranque", () => {
    const { getByRole } = render(<Footer />);

    for (const nombre of MODULOS) {
      const boton = getByRole("button", { name: nombre });
      expect(boton.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it.fails(
    "no deja los enlaces del panel cerrado en el recorrido de teclado",
    () => {
      const { container } = render(<Footer />);

      // Todo cerrado: ningún enlace de contacto debería poder recibir el foco.
      // Hoy el panel se cierra solo con `max-height: 0`, así que los 16 enlaces
      // siguen siendo enfocables y el foco desaparece de la pantalla al tabular.
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

      for (const enlace of enlacesOcultos) {
        const panel = enlace.closest("[hidden], [inert]");
        expect(panel).not.toBeNull();
      }
    },
  );
});
