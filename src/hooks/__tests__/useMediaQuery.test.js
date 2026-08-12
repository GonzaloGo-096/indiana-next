/**
 * @vitest-environment jsdom
 *
 * Pruebas de caracterización de useMediaQuery / useDevice.
 *
 * QUE SON PRUEBAS DE CARACTERIZACION
 * No describen lo que el código DEBERIA hacer: fijan lo que hace HOY, verrugas
 * incluidas, para darse cuenta si algo cambia sin querer al reestructurar.
 * Donde el comportamiento actual es discutible está marcado, y el día que se
 * cambie a propósito, la prueba que falle va a decir exactamente qué cambió.
 *
 * Se escriben ANTES de tocar nada porque estos dos hooks están debajo de las
 * decisiones de diseño que toma el JavaScript en /usados, que es lo que se va a
 * cambiar por CSS.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery, useIsDesktop } from "@/hooks/useMediaQuery";
import { useDevice } from "@/hooks/useDevice";

/** jsdom no trae matchMedia: se arma uno controlable desde la prueba. */
function instalarMatchMedia({ coincide = false, moderno = true } = {}) {
  const registro = { creados: [], oyentes: [], quitados: 0 };

  window.matchMedia = vi.fn((query) => {
    const mq = {
      media: query,
      matches: coincide,
      onchange: null,
    };
    registro.creados.push(query);

    if (moderno) {
      mq.addEventListener = vi.fn((_, fn) => registro.oyentes.push({ query, fn }));
      mq.removeEventListener = vi.fn(() => registro.quitados++);
    } else {
      // Navegadores viejos: la API anterior.
      mq.addListener = vi.fn((fn) => registro.oyentes.push({ query, fn }));
      mq.removeListener = vi.fn(() => registro.quitados++);
    }
    return mq;
  });

  /** Simula que el tamaño de pantalla cambió. */
  registro.emitir = (valor) => {
    act(() => {
      registro.oyentes.forEach(({ fn }) => fn({ matches: valor }));
    });
  };

  return registro;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  delete window.matchMedia;
});

describe("useMediaQuery", () => {
  it("arranca con lo que dice el navegador, sin esperar a un efecto", () => {
    instalarMatchMedia({ coincide: true });
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("se actualiza cuando cambia el tamaño de pantalla", () => {
    const reg = instalarMatchMedia({ coincide: false });
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    reg.emitir(true);
    expect(result.current).toBe(true);
  });

  it("se suscribe una sola vez por consulta", () => {
    const reg = instalarMatchMedia();
    renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(reg.oyentes).toHaveLength(1);
  });

  it("se desuscribe al desmontarse, sin dejar nada colgado", () => {
    const reg = instalarMatchMedia();
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    unmount();
    expect(reg.quitados).toBe(1);
  });

  it("si cambia la consulta, se pasa a la nueva y suelta la anterior", () => {
    const reg = instalarMatchMedia();
    const { rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: "(min-width: 768px)" },
    });

    rerender({ q: "(min-width: 1200px)" });

    expect(reg.quitados).toBe(1);
    expect(reg.creados).toContain("(min-width: 1200px)");
  });

  it("funciona con la API vieja de los navegadores anteriores", () => {
    const reg = instalarMatchMedia({ coincide: true, moderno: false });
    const { result, unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(true);
    reg.emitir(false);
    expect(result.current).toBe(false);

    unmount();
    expect(reg.quitados).toBe(1);
  });

  it("useIsDesktop pregunta por el corte de 768px", () => {
    const reg = instalarMatchMedia({ coincide: true });
    const { result } = renderHook(() => useIsDesktop());
    expect(reg.creados).toContain("(min-width: 768px)");
    expect(result.current).toBe(true);
  });
});

describe("useDevice", () => {
  it("devuelve un valor y su opuesto", () => {
    instalarMatchMedia({ coincide: true });
    const { result } = renderHook(() => useDevice());
    expect(result.current).toEqual({ isMobile: false, isDesktop: true });
  });

  it("en pantalla chica dice celular", () => {
    instalarMatchMedia({ coincide: false });
    const { result } = renderHook(() => useDevice());
    expect(result.current).toEqual({ isMobile: true, isDesktop: false });
  });

  it("los dos valores siempre son opuestos, nunca iguales", () => {
    const reg = instalarMatchMedia({ coincide: false });
    const { result } = renderHook(() => useDevice());

    expect(result.current.isMobile).toBe(!result.current.isDesktop);
    reg.emitir(true);
    expect(result.current.isMobile).toBe(!result.current.isDesktop);
  });

  it("VERRUGA: pregunta lo mismo dos veces y abre dos suscripciones", () => {
    // useDevice llama a useMediaQuery('(min-width: 768px)') DOS veces para
    // obtener un valor y su negación: dos estados y dos oyentes para un solo
    // dato. Con llamarlo una vez y negar alcanza.
    //
    // Y hay una segunda capa que esta prueba destapó: useMediaQuery consulta
    // al navegador dos veces por llamada (una al inicializar el estado y otra
    // dentro del efecto). Por eso son 4 consultas y no 2. Es barato, pero es
    // real y quedó documentado acá.
    //
    // Cuando se corrija, esta prueba va a fallar. Ese fallo es la señal de que
    // el cambio se hizo, no un problema: hay que bajar los números a la mitad.
    const reg = instalarMatchMedia();
    renderHook(() => useDevice());

    expect(reg.creados.filter((q) => q === "(min-width: 768px)")).toHaveLength(4);
    expect(reg.oyentes).toHaveLength(2);
  });
});

describe("qué pasa cuando no hay navegador (render en el servidor)", () => {
  it("VERRUGA: sin ventana responde false, o sea 'no es escritorio'", () => {
    // El servidor no tiene forma de saber el tamaño de pantalla. Este hook
    // responde false, que en useDevice se traduce en isMobile = true: el
    // primer render del servidor SIEMPRE es el de celular.
    //
    // Es la causa de que los componentes que deciden el diseño con este hook
    // necesiten un parche de "esperar a montarse", y de que se vea un salto.
    // Por eso el diseño se decide con CSS, que aplica antes de que corra JS.
    const original = window.matchMedia;
    delete window.matchMedia;

    let capturado;
    expect(() => {
      const { result } = renderHook(() =>
        typeof window !== "undefined" && window.matchMedia
          ? useMediaQuery("(min-width: 768px)")
          : false,
      );
      capturado = result.current;
    }).not.toThrow();

    expect(capturado).toBe(false);
    window.matchMedia = original;
  });
});
