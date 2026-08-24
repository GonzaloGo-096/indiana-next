/**
 * @vitest-environment jsdom
 *
 * Pruebas de caracterización del contrato del footer.
 *
 * El footer se va a reescribir entero: los datos salen a config/contacto, el
 * árbol se parte en varios componentes y casi todo pasa al servidor. Estas
 * pruebas son la red: fijan lo que el footer PRODUCE hoy, no cómo está escrito
 * por dentro, así que tienen que seguir pasando sin editarse después del
 * rewrite. Si para que pasen hay que tocarlas, el rewrite cambió comportamiento
 * y esa decisión hay que tomarla a propósito.
 *
 * Se cubren dos cosas que no se pueden romper en silencio:
 *
 *   1. Los 16 enlaces y sus href. Son los teléfonos, las direcciones y los
 *      WhatsApp de Indiana; un error acá manda gente a ningún lado.
 *   2. Los 8 component_id que viajan a GA4. Alimentan reportes en curso: si
 *      cambian, se corta la serie histórica y nadie se entera hasta que alguien
 *      mire un gráfico dentro de tres meses.
 *
 * Por eso se entra por `@/components/layout/Footer` —la puerta pública, que
 * sobrevive al rewrite— y no por los archivos de adentro, que desaparecen.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

const pushDataLayer = vi.fn();

vi.mock("@/lib/analytics/dataLayer", () => ({
  pushDataLayer: (...args) => pushDataLayer(...args),
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

// Vitest corre sin `globals`, así que el cleanup automático de Testing Library
// no se registra solo y los renders se irían acumulando en el body.
afterEach(cleanup);

/**
 * Los ítems viven dentro de acordeones cerrados. Se abren todos —los tres
 * módulos y las dos sedes— para poder mirar los enlaces.
 */
function renderFooterAbierto() {
  const utils = render(<Footer />);

  // jsdom avisa "Not implemented: navigation" en cada clic sobre un enlace real.
  // El handler de analytics ya corrio para cuando esto burbujea, asi que frenar
  // la navegacion no cambia lo que se mide y deja la salida limpia.
  utils.container.addEventListener("click", (evento) => evento.preventDefault());

  const abrir = (nombre) => {
    const boton = utils.getByRole("button", { name: nombre });
    fireEvent.click(boton);
  };

  abrir("Peugeot oficial | 0 km");
  abrir("Multimarca | Usados");
  abrir("Posventa / Taller");
  abrir("Sede San Miguel de Tucumán");
  abrir("Sede Yerba Buena - Tucumán");

  return utils;
}

/** Todos los href del footer, en orden de aparición. */
function hrefs(container) {
  return [...container.querySelectorAll("a[href]")].map((a) =>
    a.getAttribute("href"),
  );
}

const WHATSAPP_BASE = "https://api.whatsapp.com/send?phone=543816295959";

describe("contrato de enlaces del footer", () => {
  beforeEach(() => {
    pushDataLayer.mockClear();
  });

  it("arma los cuatro WhatsApp con su mensaje precargado", () => {
    const { container } = renderFooterAbierto();
    const whatsapps = hrefs(container).filter((h) =>
      h.startsWith("https://api.whatsapp.com"),
    );

    // api.whatsapp.com en vez de wa.me es a propósito: está comentado en la
    // configuración que es por compatibilidad con los mensajes precargados.
    expect(whatsapps).toEqual([
      `${WHATSAPP_BASE}&text=Hola%2C%20estoy%20interesado%20en%20veh%C3%ADculos%200KM%20-%20Sede%20San%20Miguel`,
      `${WHATSAPP_BASE}&text=Hola%2C%20estoy%20interesado%20en%20veh%C3%ADculos%200KM%20-%20Sede%20Yerba%20Buena`,
      `${WHATSAPP_BASE}&text=Hola%2C%20estoy%20interesado%20en%20autos%20usados`,
      `${WHATSAPP_BASE}&text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20servicios%20de%20postventa`,
    ]);
  });

  it("arma los teléfonos en formato internacional, sin el 0 nacional", () => {
    const { container } = renderFooterAbierto();
    const telefonos = hrefs(container).filter((h) => h.startsWith("tel:"));

    expect(telefonos).toEqual([
      "tel:+543814212000",
      "tel:+543814212000",
      "tel:+543812313107",
      "tel:+543814347700",
    ]);
  });

  it("expone el telefono en formato nacional como nombre accesible", () => {
    const { container } = renderFooterAbierto();

    // Hoy el footer no muestra el numero en pantalla: la fila es solo iconos y
    // el texto vive en el aria-label. Lo que se marca (+54381...) y lo que se
    // anuncia ((0381)...) son dos formatos distintos del mismo telefono.
    const usados = container.querySelector('a[href="tel:+543812313107"]');
    const posventa = container.querySelector('a[href="tel:+543814347700"]');

    expect(usados.getAttribute("aria-label")).toBe("(0381) 231-3107");
    expect(posventa.getAttribute("aria-label")).toBe("(0381) 434-7700");
  });

  it("expone la direccion de cada sede como nombre accesible del enlace a Maps", () => {
    const { container } = renderFooterAbierto();
    const mapas = [...container.querySelectorAll('a[href^="https://maps.google.com"]')];

    // Mismo caso que el telefono: la direccion no se ve, se anuncia.
    expect(mapas.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Salta 160, San Miguel de Tucumán (se abre en nueva ventana)",
      "Av. Aconquija y Bascary, Yerba Buena (se abre en nueva ventana)",
      "Santa Fe 2145, San Miguel de Tucumán (se abre en nueva ventana)",
      "Italia 2945, San Miguel de Tucumán (se abre en nueva ventana)",
    ]);
  });

  it("arma los cuatro enlaces a Google Maps con la dirección de cada sede", () => {
    const { container } = renderFooterAbierto();
    const mapas = hrefs(container).filter((h) =>
      h.startsWith("https://maps.google.com"),
    );

    expect(mapas).toEqual([
      "https://maps.google.com/maps?q=Salta%20160%2C%20San%20Miguel%20de%20Tucum%C3%A1n",
      "https://maps.google.com/maps?q=Av.%20Aconquija%20y%20Bascary%2C%20Yerba%20Buena",
      "https://maps.google.com/maps?q=Santa%20Fe%202145%2C%20San%20Miguel%20de%20Tucum%C3%A1n",
      "https://maps.google.com/maps?q=Italia%202945%2C%20San%20Miguel%20de%20Tucum%C3%A1n",
    ]);
  });

  it("arma los Instagram de cada vertical", () => {
    const { container } = renderFooterAbierto();
    const instagram = hrefs(container).filter((h) =>
      h.startsWith("https://instagram.com"),
    );

    expect(instagram).toEqual([
      "https://instagram.com/peugeotindiana",
      "https://instagram.com/peugeotindiana",
      "https://instagram.com/usadosindiana",
      "https://instagram.com/peugeotindiana",
    ]);
  });

  it("lleva los siete enlaces internos del sitio", () => {
    const { container } = renderFooterAbierto();
    const internos = hrefs(container).filter((h) => h.startsWith("/"));

    expect(internos).toEqual([
      "/0km",
      "/planes",
      "/usados",
      "/postventa",
      "/trabaja-con-nosotros",
      "/usados/vehiculos",
      "/0km",
    ]);
  });

  it("abre en pestaña nueva solo los enlaces que salen del sitio", () => {
    const { container } = renderFooterAbierto();
    const externos = [...container.querySelectorAll('a[target="_blank"]')];

    // WhatsApp, Instagram y Maps: 3 por sede × 4 sedes.
    expect(externos).toHaveLength(12);
    for (const a of externos) {
      expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });
});

describe("contrato de analytics del footer", () => {
  beforeEach(() => {
    pushDataLayer.mockClear();
  });

  it("manda un component_id estable por cada enlace trackeado", () => {
    const { container } = renderFooterAbierto();

    const trackeados = [...container.querySelectorAll("a[href]")].filter(
      (a) =>
        a.getAttribute("href").startsWith("tel:") ||
        a.getAttribute("href").startsWith("https://api.whatsapp.com"),
    );

    const vistos = [];
    for (const enlace of trackeados) {
      pushDataLayer.mockClear();
      fireEvent.click(enlace);
      const [, params] = pushDataLayer.mock.calls[0];
      vistos.push(params.component_id);
    }

    expect(vistos).toEqual([
      "footer-whatsapp-peugeot-san-miguel",
      "footer-tel-peugeot-san-miguel",
      "footer-whatsapp-peugeot-yerbabuena",
      "footer-tel-peugeot-yerbabuena",
      "footer-whatsapp-multimarca-usados",
      "footer-tel-multimarca-usados",
      "footer-whatsapp-posventa-taller",
      "footer-tel-posventa-taller",
    ]);
  });

  it("marca todos los eventos del footer con source footer y location home", () => {
    const { container } = renderFooterAbierto();
    const primerWhatsApp = container.querySelector(
      'a[href^="https://api.whatsapp.com"]',
    );

    fireEvent.click(primerWhatsApp);

    const [, params] = pushDataLayer.mock.calls[0];
    expect(params.source).toBe("footer");
    expect(params.location).toBe("home");
  });

  it("dispara whatsapp_click y generate_lead en cada clic de WhatsApp", () => {
    const { container } = renderFooterAbierto();
    const primerWhatsApp = container.querySelector(
      'a[href^="https://api.whatsapp.com"]',
    );

    fireEvent.click(primerWhatsApp);

    const eventos = pushDataLayer.mock.calls.map(([nombre]) => nombre);
    expect(eventos).toEqual(["whatsapp_click", "generate_lead"]);
  });

  it("dispara phone_click y generate_lead en cada clic de teléfono", () => {
    const { container } = renderFooterAbierto();
    const primerTel = container.querySelector('a[href^="tel:"]');

    fireEvent.click(primerTel);

    const eventos = pushDataLayer.mock.calls.map(([nombre]) => nombre);
    expect(eventos).toEqual(["phone_click", "generate_lead"]);
  });
});
