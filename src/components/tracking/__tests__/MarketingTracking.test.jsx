/**
 * @vitest-environment jsdom
 *
 * El cableado real: qué script arma MarketingTracking con las variables de
 * Vercel y qué carga cada uno según el dominio. Los builders ya tienen sus
 * tests; esto cubre que el componente los use, y con qué opciones.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

// next/script no ejecuta nada en jsdom: se reemplaza por algo que expone el código.
vi.mock("next/script", () => ({
  default: ({ id, children }) => (
    <script data-testid={id} type="text/plain">
      {children}
    </script>
  ),
}));

const { default: MarketingTracking } = await import("../MarketingTracking");

/** Corre cada snippet renderizado con el dominio dado y devuelve qué cargó. */
function correrEn(hostname) {
  const codigos = [...document.querySelectorAll("script[data-testid]")].map((s) => s.textContent);
  document.head.innerHTML = "<script></script>";
  window.dataLayer = [];
  delete window.fbq;
  delete window._fbq;
  for (const codigo of codigos) {
    new Function("location", codigo)({ hostname });
  }
  const srcs = [...document.head.querySelectorAll("script[src]")].map((s) => s.src);
  return {
    nuestro: srcs.some((s) => s.includes("id=GTM-NUESTRO")),
    agencia: srcs.some((s) => s.includes("id=GTM-AGENCIA")),
    pixel: srcs.some((s) => s.includes("fbevents.js")),
    marcaPrueba: window.dataLayer.some((e) => e && e.analytics_test === true),
  };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-NUESTRO");
  vi.stubEnv("NEXT_PUBLIC_GTM_MARKETING_ID", "GTM-AGENCIA");
  vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "123");
  vi.stubEnv("NEXT_PUBLIC_ANALYTICS_TEST", "");
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("MarketingTracking", () => {
  it("en producción carga los tres, sin marca de prueba", () => {
    render(<MarketingTracking />);
    expect(correrEn("www.indiana.com.ar")).toEqual({ nuestro: true, agencia: true, pixel: true, marcaPrueba: false });
  });

  it("en una copia de Vercel, sin pedirlo, no carga nada", () => {
    render(<MarketingTracking />);
    expect(correrEn("indiana-next-abc.vercel.app")).toEqual({ nuestro: false, agencia: false, pixel: false, marcaPrueba: false });
  });

  it("con NEXT_PUBLIC_ANALYTICS_TEST=true fuera de producción: solo el nuestro, marcado como prueba", () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_TEST", "true");
    render(<MarketingTracking />);
    expect(correrEn("localhost")).toEqual({ nuestro: true, agencia: false, pixel: false, marcaPrueba: true });
  });

  it.each(["1", "TRUE", "yes"])("NEXT_PUBLIC_ANALYTICS_TEST=%s no habilita la carga", (v) => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_TEST", v);
    render(<MarketingTracking />);
    expect(correrEn("localhost").nuestro).toBe(false);
  });

  it("sin ningún ID no renderiza nada", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
    vi.stubEnv("NEXT_PUBLIC_GTM_MARKETING_ID", "");
    vi.stubEnv("NEXT_PUBLIC_META_PIXEL_ID", "");
    const { container } = render(<MarketingTracking />);
    expect(container.innerHTML).toBe("");
  });
});
