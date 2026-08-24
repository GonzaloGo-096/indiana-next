/**
 * @vitest-environment jsdom
 *
 * Pruebas de caracterización de FilterFormSimple.
 *
 * 504 líneas, ocho efectos y tres responsabilidades mezcladas: los filtros, cómo
 * se muestra (panel de escritorio, cajón de celular y modo franja) y efectos
 * sobre la página entera. Es el archivo con más deuda de la sección.
 *
 * Estas pruebas NO describen cómo debería ser: fijan lo que hace hoy, para que
 * la reestructuración que viene no cambie nada sin que se note. Lo que se cubre
 * es el contrato con quien lo usa —qué recibe, qué avisa, qué expone por
 * referencia— y no el detalle de cómo está escrito por dentro, que es
 * justamente lo que va a cambiar.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { createRef } from "react";

vi.mock("@/components/ui/RangeSlider/RangeSlider", () => ({
  default: ({ label }) => <div data-rango={label || "rango"} />,
}));

vi.mock("@/components/ui/icons/CloseIcon", () => ({
  CloseIcon: () => <span data-icono="cerrar" />,
}));

const FilterFormSimple = (await import("@/components/vehicles/Filters/FilterFormSimple")).default;

/** jsdom no trae matchMedia; useDevice lo necesita. */
function pantalla({ escritorio = true } = {}) {
  window.matchMedia = vi.fn(() => ({
    matches: escritorio,
    media: "(min-width: 768px)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function montar(props = {}) {
  const ref = createRef();
  const onApplyFilters = vi.fn();
  const utils = render(
    <FilterFormSimple ref={ref} onApplyFilters={onApplyFilters} {...props} />,
  );
  return { ref, onApplyFilters, ...utils };
}

beforeEach(() => {
  pantalla({ escritorio: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

describe("se dibuja sin romperse", () => {
  it("con lo mínimo indispensable", () => {
    expect(() => montar()).not.toThrow();
  });

  it("en modo franja", () => {
    expect(() => montar({ stripLayout: true })).not.toThrow();
  });

  it("en celular", () => {
    pantalla({ escritorio: false });
    expect(() => montar()).not.toThrow();
  });

  it("con filtros ya aplicados que vienen del padre", () => {
    expect(() =>
      montar({ currentFilters: { marca: ["Peugeot"], caja: ["Manual"] } }),
    ).not.toThrow();
  });
});

describe("el contrato que expone por referencia", () => {
  it("ofrece todo lo que sus usuarios esperan", () => {
    const { ref } = montar();
    for (const metodo of [
      "toggleDrawer",
      "closeDrawer",
      "toggleFilters",
      "showFilters",
      "hideFilters",
      "updateMarcaFilter",
      "getCurrentFilters",
    ]) {
      expect(typeof ref.current[metodo]).toBe("function");
    }
    expect(typeof ref.current.isDrawerOpen).toBe("boolean");
    expect(typeof ref.current.isFiltersVisible).toBe("boolean");
  });

  it("empieza cerrado", () => {
    const { ref } = montar();
    expect(ref.current.isDrawerOpen).toBe(false);
    expect(ref.current.isFiltersVisible).toBe(false);
  });

  it("showFilters abre y hideFilters cierra", () => {
    const { ref } = montar();

    act(() => ref.current.showFilters());
    expect(ref.current.isFiltersVisible).toBe(true);

    act(() => ref.current.hideFilters());
    expect(ref.current.isFiltersVisible).toBe(false);
  });

  it("toggleFilters alterna", () => {
    const { ref } = montar();
    act(() => ref.current.toggleFilters());
    expect(ref.current.isFiltersVisible).toBe(true);
    act(() => ref.current.toggleFilters());
    expect(ref.current.isFiltersVisible).toBe(false);
  });

  it("isDrawerOpen e isFiltersVisible dicen siempre lo mismo", () => {
    // Son dos nombres para el mismo dato: quedaron de dos sistemas anteriores
    // que se unificaron. La reestructuración debería dejar uno solo.
    const { ref } = montar();
    expect(ref.current.isDrawerOpen).toBe(ref.current.isFiltersVisible);
    act(() => ref.current.showFilters());
    expect(ref.current.isDrawerOpen).toBe(ref.current.isFiltersVisible);
  });

  it("en modo franja también abre y cierra", () => {
    const { ref } = montar({ stripLayout: true });
    act(() => ref.current.toggleFilters());
    expect(ref.current.isFiltersVisible).toBe(true);
  });
});

describe("los filtros que guarda", () => {
  it("arranca con los que le pasa el padre", () => {
    const { ref } = montar({
      currentFilters: { marca: ["Peugeot", "Toyota"], caja: ["Manual"] },
    });
    const f = ref.current.getCurrentFilters();
    expect(f.marca).toEqual(["Peugeot", "Toyota"]);
    expect(f.caja).toEqual(["Manual"]);
  });

  it("rellena con valores por defecto lo que el padre no manda", () => {
    const { ref } = montar({ currentFilters: { marca: ["Peugeot"] } });
    const f = ref.current.getCurrentFilters();
    expect(f.combustible).toEqual([]);
    expect(Array.isArray(f.precio)).toBe(true);
    expect(f.precio).toHaveLength(2);
  });

  it("se actualiza si el padre cambia los filtros", () => {
    const { ref, rerender } = (() => {
      const ref = createRef();
      const r = render(
        <FilterFormSimple ref={ref} onApplyFilters={vi.fn()} currentFilters={{ marca: ["A"] }} />,
      );
      return { ref, rerender: r.rerender };
    })();

    expect(ref.current.getCurrentFilters().marca).toEqual(["A"]);

    act(() => {
      rerender(
        <FilterFormSimple ref={ref} onApplyFilters={vi.fn()} currentFilters={{ marca: ["B"] }} />,
      );
    });
    expect(ref.current.getCurrentFilters().marca).toEqual(["B"]);
  });

  it("updateMarcaFilter cambia la marca desde afuera, sin tocar el resto", () => {
    const { ref } = montar({ currentFilters: { caja: ["Manual"] } });

    act(() => ref.current.updateMarcaFilter(["Honda"]));

    const f = ref.current.getCurrentFilters();
    expect(f.marca).toEqual(["Honda"]);
    expect(f.caja).toEqual(["Manual"]);
  });
});

describe("aplicar y limpiar", () => {
  it("al enviar avisa al padre con los filtros actuales", () => {
    const { ref, onApplyFilters, container } = montar({
      currentFilters: { marca: ["Peugeot"] },
    });

    const form = container.querySelector("form");
    expect(form).not.toBeNull();

    act(() => {
      fireEvent.submit(form);
    });

    expect(onApplyFilters).toHaveBeenCalledTimes(1);
    expect(onApplyFilters.mock.calls[0][0]).toMatchObject({ marca: ["Peugeot"] });
    void ref;
  });

  it("al enviar cierra el panel", () => {
    const { ref, container } = montar();
    act(() => ref.current.showFilters());
    expect(ref.current.isFiltersVisible).toBe(true);

    act(() => {
      fireEvent.submit(container.querySelector("form"));
    });

    expect(ref.current.isFiltersVisible).toBe(false);
  });

  it("si el padre falla al aplicar, el formulario no se rompe", () => {
    const onApplyFilters = vi.fn(() => {
      throw new Error("se cayó la red");
    });
    const ref = createRef();
    const { container } = render(
      <FilterFormSimple ref={ref} onApplyFilters={onApplyFilters} />,
    );

    expect(() => {
      act(() => {
        fireEvent.submit(container.querySelector("form"));
      });
    }).not.toThrow();
  });
});

describe("la tecla Escape", () => {
  it("cierra el panel cuando está abierto", () => {
    const { ref } = montar();
    act(() => ref.current.showFilters());
    expect(ref.current.isFiltersVisible).toBe(true);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(ref.current.isFiltersVisible).toBe(false);
  });

  it("con el panel cerrado no hace nada", () => {
    const { ref } = montar();
    expect(() => {
      act(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      });
    }).not.toThrow();
    expect(ref.current.isFiltersVisible).toBe(false);
  });

  it("otra tecla no cierra nada", () => {
    const { ref } = montar();
    act(() => ref.current.showFilters());

    act(() => {
      fireEvent.keyDown(document, { key: "a" });
    });

    expect(ref.current.isFiltersVisible).toBe(true);
  });
});

describe("avisos al contenedor en modo franja", () => {
  it("le informa cuándo se abre y cuándo se cierra", () => {
    const onStripFiltersOpenChange = vi.fn();
    const ref = createRef();
    render(
      <FilterFormSimple
        ref={ref}
        onApplyFilters={vi.fn()}
        stripLayout
        onStripFiltersOpenChange={onStripFiltersOpenChange}
      />,
    );

    onStripFiltersOpenChange.mockClear();
    act(() => ref.current.showFilters());
    expect(onStripFiltersOpenChange).toHaveBeenCalledWith(true);

    act(() => ref.current.hideFilters());
    expect(onStripFiltersOpenChange).toHaveBeenCalledWith(false);
  });

  it("al desmontarse avisa que quedó cerrado, para no dejar al padre creyendo que sigue abierto", () => {
    const onStripFiltersOpenChange = vi.fn();
    const ref = createRef();
    const { unmount } = render(
      <FilterFormSimple
        ref={ref}
        onApplyFilters={vi.fn()}
        stripLayout
        onStripFiltersOpenChange={onStripFiltersOpenChange}
      />,
    );

    act(() => ref.current.showFilters());
    onStripFiltersOpenChange.mockClear();

    unmount();
    expect(onStripFiltersOpenChange).toHaveBeenCalledWith(false);
  });
});
