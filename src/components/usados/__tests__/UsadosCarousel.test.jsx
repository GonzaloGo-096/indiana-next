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

/** Cuenta los separadores decorativos que UsadosCarousel pone en los bordes. */
function separadores(contenedor) {
  return [...contenedor.querySelectorAll("[aria-hidden]")].filter((el) =>
    /LeadSpacer/i.test(el.className),
  ).length;
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

describe("el recorte de borde a borde, ahora resuelto en CSS", () => {
  // Antes esto lo decidía el JavaScript: el componente preguntaba el ancho de
  // pantalla y solo entonces agregaba los separadores y el envoltorio. Como el
  // servidor no puede medir la pantalla, el primer render salía con el diseño
  // de escritorio y en celular se veía saltar.
  //
  // Ahora la estructura está siempre y el CSS decide: arriba de 768px el
  // separador es `display: none` y el envoltorio no hace nada. Estas pruebas
  // fijan que la estructura ya no dependa de ningún parámetro.

  it("los separadores están siempre, sin depender de ningún parámetro", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(3)} />);
    expect(separadores(container)).toBe(2);
  });

  it("uno antes y otro después de las fichas", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(3)} />);
    const esSeparador = (el) => /LeadSpacer/i.test(el.className);

    // Solo separadores y fichas: el carrusel tiene otros elementos ocultos
    // (flechas, puntos) que no interesan para este orden.
    const enOrden = [...container.querySelectorAll("[aria-hidden], [data-ficha]")].filter(
      (el) => esSeparador(el) || el.hasAttribute("data-ficha"),
    );

    expect(esSeparador(enOrden[0])).toBe(true);
    expect(esSeparador(enOrden[enOrden.length - 1])).toBe(true);
    expect(enOrden).toHaveLength(5); // 2 separadores + 3 fichas
  });

  it("el envoltorio del recorte también está siempre", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(3)} />);
    const clases = [...container.querySelectorAll("div")].map((d) => d.className).join(" ");
    expect(clases).toMatch(/viewportClip/i);
  });

  it("los separadores no los lee un lector de pantalla", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(2)} />);
    [...container.querySelectorAll("div")]
      .filter((el) => /LeadSpacer/i.test(el.className))
      .forEach((el) => expect(el.getAttribute("aria-hidden")).toBe("true"));
  });

  it("los separadores no cuentan como fichas", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(5)} />);
    expect(container.querySelectorAll("[data-ficha]")).toHaveLength(5);
  });
});

describe("los parámetros de estilo suman clases, no cambian el contenido", () => {
  const contar = (props) =>
    render(<UsadosCarousel vehicles={autos(3)} {...props} />).container.querySelectorAll(
      "[data-ficha]",
    ).length;

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
      <UsadosCarousel vehicles={autos(2)} flushLeadingEdge />,
    );
    const clases = [...container.querySelectorAll("div")]
      .map((d) => d.className)
      .join(" ");

    expect(clases).toMatch(/Compact/i);
    expect(clases).toMatch(/ViewportClip/i);
    expect(clases).toMatch(/FlushLeading/i);
  });
});

describe("la combinación real de /usados y del inicio", () => {
  it("convive con flushLeadingEdge sin romper", () => {
    const { container } = render(<UsadosCarousel vehicles={autos(6)} flushLeadingEdge />);
    expect(container.querySelectorAll("[data-ficha]")).toHaveLength(6);
    expect(separadores(container)).toBe(2);
  });
});
