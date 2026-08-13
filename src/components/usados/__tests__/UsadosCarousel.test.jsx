/**
 * @vitest-environment jsdom
 *
 * Pruebas de caracterización de UsadosCarousel.
 *
 * Este componente lo usan DOS páginas: el inicio y /usados. Un error acá se ve
 * en la portada, así que antes de tocarlo se fija lo que hace hoy.
 *
 * Lo que se fija es la ESTRUCTURA que produce según sus parámetros, porque el
 * cambio que viene mueve a CSS lo que hoy decide el JavaScript. Estas pruebas
 * son las que van a avisar si en el camino se pierde un elemento o cambia el
 * anidado.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// La ficha tiene imágenes, tracking y lógica propia: no es lo que se prueba acá.
vi.mock("@/components/vehicles/Card/CardSimilar/CardSimilar", () => ({
  CardSimilar: ({ auto }) => <div data-ficha={auto.id} />,
}));

// El import dentro del componente es relativo; se simula el mismo módulo.
vi.mock("../../vehicles/Card/CardSimilar/CardSimilar", () => ({
  CardSimilar: ({ auto }) => <div data-ficha={auto.id} />,
}));

const { UsadosCarousel } = await import("@/components/usados/UsadosCarousel");

const autos = (n) =>
  Array.from({ length: n }, (_, i) => ({ id: `a${i}`, marca: "Peugeot", modelo: `20${i}` }));

/** Cuenta los separadores decorativos que UsadosCarousel agrega en los bordes. */
function separadores(contenedor) {
  return contenedor.querySelectorAll('[aria-hidden][style*="flex-shrink"]').length;
}

beforeEach(() => {
  // jsdom no calcula tamaños: el carrusel consulta scrollWidth para las flechas.
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    value: 400,
  });
});

describe("estructura básica", () => {
  it("renderiza una ficha por vehículo", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(4)} />);
    expect(container.querySelectorAll("[data-ficha]")).toHaveLength(4);
  });

  it("sin vehículos no renderiza nada", () => {
    // VERRUGA: el archivo tiene un bloque "No hay vehículos disponibles" con su
    // estilo .emptyState, pero es INALCANZABLE. Arriba (línea ~308) hay una
    // salida temprana: si la lista está vacía devuelve null y nunca llega ahí.
    //
    // O sea que el componente desaparece en silencio en vez de avisar. Se fija
    // el comportamiento real; el bloque muerto se saca cuando se toque el
    // archivo, y si algún día se quiere el aviso de verdad hay que quitar la
    // salida temprana, no agregar código nuevo.
    const { container } = render(<UsadosCarousel vehicles={[]} />);
    expect(container.textContent).toBe("");
    expect(container.querySelectorAll("[data-ficha]")).toHaveLength(0);
  });

  it("sin la lista tampoco rompe", () => {
    expect(() => render(<UsadosCarousel />)).not.toThrow();
  });
});

describe("viewportClip: lo que hoy decide el JavaScript", () => {
  it("APAGADO: sin envoltorio extra y sin separadores", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(3)} viewportClip={false} />);
    expect(separadores(container)).toBe(0);
  });

  it("ENCENDIDO: agrega un separador antes y otro después de las fichas", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(3)} viewportClip />);
    expect(separadores(container)).toBe(2);
  });

  it("ENCENDIDO: envuelve todo en un contenedor más", () => {
    const sin = render(<UsadosCarousel vehicles={autos(3)} viewportClip={false} />);
    const con = render(<UsadosCarousel vehicles={autos(3)} viewportClip />);

    const profundidad = (c) => {
      let n = 0;
      let el = c.querySelector("[data-ficha]");
      while (el && el !== c) {
        n++;
        el = el.parentElement;
      }
      return n;
    };

    expect(profundidad(con.container)).toBe(profundidad(sin.container) + 1);
  });

  it("ENCENDIDO: los separadores no los lee un lector de pantalla", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(2)} viewportClip />);
    container
      .querySelectorAll('[style*="flex-shrink"]')
      .forEach((el) => expect(el.getAttribute("aria-hidden")).not.toBeNull());
  });

  it("la cantidad de fichas no cambia con o sin recorte", () => {
    const sin = render(<UsadosCarousel vehicles={autos(5)} viewportClip={false} />);
    const con = render(<UsadosCarousel vehicles={autos(5)} viewportClip />);
    expect(con.container.querySelectorAll("[data-ficha]")).toHaveLength(
      sin.container.querySelectorAll("[data-ficha]").length,
    );
  });
});

describe("los parámetros de estilo suman clases, no cambian el contenido", () => {
  const contar = (props) =>
    render(<UsadosCarousel vehicles={autos(3)} {...props} />).container.querySelectorAll(
      "[data-ficha]",
    ).length;

  it("compact no altera cuántas fichas se ven", () => {
    expect(contar({ compact: true })).toBe(contar({ compact: false }));
  });

  it("homeDesktopFourColumns tampoco", () => {
    expect(contar({ homeDesktopFourColumns: true })).toBe(
      contar({ homeDesktopFourColumns: false }),
    );
  });

  it("flushLeadingEdge tampoco", () => {
    expect(contar({ flushLeadingEdge: true })).toBe(contar({ flushLeadingEdge: false }));
  });

  it("cada parámetro agrega su propia clase al contenedor", () => {
    const { container } = render(
      <UsadosCarousel vehicles={autos(2)} compact viewportClip flushLeadingEdge />,
    );
    const clases = [...container.querySelectorAll("div")]
      .map((d) => d.className)
      .join(" ");

    expect(clases).toMatch(/Compact/i);
    expect(clases).toMatch(/ViewportClip|viewportClip/i);
    expect(clases).toMatch(/FlushLeading/i);
  });
});

describe("la combinación real de /usados y del inicio en celular", () => {
  it("compact + viewportClip + flushLeadingEdge convive sin romper", () => {
    const { container } = render(
      <UsadosCarousel vehicles={autos(6)} compact viewportClip flushLeadingEdge />,
    );
    expect(container.querySelectorAll("[data-ficha]")).toHaveLength(6);
    expect(separadores(container)).toBe(2);
  });
});
