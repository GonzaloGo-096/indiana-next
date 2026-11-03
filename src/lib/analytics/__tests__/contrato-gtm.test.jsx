/**
 * @vitest-environment jsdom
 *
 * Correspondencia código ↔ GTM. Antes de la medición simple, 8 eventos se
 * mandaban desde el código y nunca llegaban a GA4 porque no tenían etiqueta.
 * Este test hace fallar el check si vuelve a pasar algo así:
 *  - un evento del código sin etiqueta en GTM (o al revés);
 *  - un parámetro que el código manda y GTM no lee, o que GTM lee y nadie manda;
 *  - el JSON para importar desactualizado, o con referencias a variables que no existen;
 *  - una etiqueta de GA4 sin debug_mode, o la marca de prueba colándose en un evento;
 *  - el form_id de la postulación distinto al que filtra el puente generate_lead.
 *
 * Cada emisor se ejerce con el código real: componentes renderizados, el hook
 * del listado de usados y el formulario de empleo enviado de verdad.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, fireEvent, cleanup, act, renderHook, waitFor } from "@testing-library/react";
import { CONTRATO, PUENTE, MARCA_PRUEBA, buildContainer } from "../../../../scripts/gtm-definition.mjs";
import { EVENTS, FORM_IDS, LEAD_COMPAT } from "../events";
import { CONSENT_STORAGE_KEY } from "../consent";
import { buildIndianaGtmSnippet } from "../gtmLoader";
import { buildItemParamsFromAuto, buildItemParamsFromUsado, buildItemParamsFromPlan } from "../params";

const m = vi.hoisted(() => ({ pathname: "/", getVehicles: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => m.pathname,
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/services/vehiclesApi", () => ({ vehiclesService: { getVehicles: (...a) => m.getVehicles(...a) } }));
vi.mock("@/lib/mappers/vehicleMapper", async (orig) => ({ ...(await orig()), mapVehiclesPage: (d) => d }));
vi.mock("@/app/(site)/usados/vehiculos/useScrollRestore", () => ({ useScrollRestore: () => {} }));

const { default: WhatsAppLink } = await import("@/components/analytics/WhatsAppLink");
const { default: TelLink } = await import("@/components/analytics/TelLink");
const { default: ItemViewTracker } = await import("@/components/analytics/ItemViewTracker");
const { default: PageViewTracker, FICHA_MAX_MS } = await import("@/components/analytics/PageViewTracker");
const { useVehiclesList } = await import("@/app/(site)/usados/vehiculos/useVehiclesList");
const { default: CareersForm } = await import("@/components/careers/CareersForm");
const { jobPositions } = await import("@/lib/careers.data");

const RAIZ = path.resolve(__dirname, "../../../..");
const enviadas = (e) => Object.keys(e).filter((k) => k !== "event" && e[k] !== undefined);

/** Lo que el código real empuja al dataLayer, ejerciendo cada emisor una vez. */
let capturados = [];
let todos = [];

beforeAll(async () => {
  vi.spyOn(console, "debug").mockImplementation(() => {});
  window.dataLayer = [];
  // Con la medición aceptada, que es cuando viaja todo lo que GTM lee (lead_ref).
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, ads: true, ts: 1 }));
  document.title = "Peugeot 208 0km | Peugeot Indiana"; // el sitio siempre tiene título; jsdom no
  window.history.pushState({}, "", "/0km/208");
  m.pathname = "/0km/208";

  // page_view
  vi.useFakeTimers();
  render(<PageViewTracker />);
  // es una ficha: sin ItemViewTracker montado, la visita sale al tope
  act(() => vi.advanceTimersByTime(FICHA_MAX_MS));
  vi.useRealTimers();

  // view_item de los tres tipos de ficha
  const auto = buildItemParamsFromAuto({ slug: "208", titulo: "208" });
  render(<ItemViewTracker item={auto} />);
  render(<ItemViewTracker item={buildItemParamsFromUsado({ _id: "6ab26f0973c7ebf8ffbe4285", marca: "Peugeot", modelo: "2008", anio: 2020 })} />);
  render(<ItemViewTracker item={buildItemParamsFromPlan({ id: "easy", nombre: "Easy", modelo: "208" })} />);

  // whatsapp_click (ficha y flotante) y phone_click
  const { getByText, getByLabelText } = render(
    <>
      <WhatsAppLink href="https://wa.me/1?text=Hola" componentId="whatsapp-detalle-0km" item={auto}>ficha</WhatsAppLink>
      <WhatsAppLink href="https://wa.me/1" componentId="whatsapp-floating" itemFromPage aria-label="flotante" />
      <TelLink phone="0381 421-2000" componentId="footer-tel-x" aria-label="tel" />
    </>,
  );
  fireEvent.click(getByText("ficha"));
  fireEvent.click(getByLabelText("flotante"));
  fireEvent.click(getByLabelText("tel"));
  cleanup();

  // view_search_results desde el hook real del listado
  window.history.pushState({}, "", "/usados/vehiculos");
  m.getVehicles.mockResolvedValue({ vehicles: [{ id: 1, marca: "Ford" }], total: 1, hasNextPage: false, nextPage: null, currentCursor: 1, totalPages: 1 });
  const { result } = renderHook(() => useVehiclesList({ initialData: { vehicles: [], total: 0 }, initialError: null }));
  await act(async () => {
    await result.current.applyFilters({ marca: ["Ford"], caja: ["Manual"] });
  });
  cleanup();

  // form_submit: el formulario de empleo enviado de verdad (el envío al servidor se simula)
  window.history.pushState({}, "", "/trabaja-con-nosotros");
  const fetchOriginal = global.fetch;
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  const form = render(<CareersForm />);
  fireEvent.change(form.container.querySelector("#puesto"), { target: { value: jobPositions[0].value } });
  fireEvent.change(form.container.querySelector("#nombreApellido"), { target: { value: "Prueba Contrato" } });
  fireEvent.change(form.container.querySelector("#email"), { target: { value: "prueba@example.com" } });
  const cv = new File(["%PDF-1.4"], "cv.pdf", { type: "application/pdf" });
  fireEvent.change(form.container.querySelector("#cv"), { target: { files: [cv] } });
  fireEvent.submit(form.container.querySelector("form"));
  await waitFor(() => expect(window.dataLayer.some((e) => e.event === "form_submit")).toBe(true));
  global.fetch = fetchOriginal;
  cleanup();

  todos = window.dataLayer.filter((e) => e && e.event && !String(e.event).startsWith("gtm"));
  // El aviso de compatibilidad es para la v9 y el GTM nuevo no lo escucha:
  // tiene sus propios tests al final.
  capturados = todos.filter((e) => e.event !== LEAD_COMPAT.event);
});

afterEach(() => {
  cleanup();
});

describe("contrato código ↔ GTM", () => {
  it("se ejercieron los seis emisores", () => {
    expect([...new Set(capturados.map((e) => e.event))].sort()).toEqual(Object.keys(CONTRATO).sort());
  });

  it("los eventos del código son exactamente los que tienen etiqueta en GTM", () => {
    expect([...Object.values(EVENTS)].sort()).toEqual(Object.keys(CONTRATO).sort());
  });

  it("todo parámetro que el código manda lo lee GTM", () => {
    const sobrantes = capturados.flatMap((e) => enviadas(e).filter((k) => !CONTRATO[e.event]?.includes(k)).map((k) => `${e.event}.${k}`));
    expect(sobrantes).toEqual([]);
  });

  it("todo parámetro que GTM lee lo manda algún código", () => {
    const vistos = {};
    for (const e of capturados) enviadas(e).forEach((k) => (vistos[e.event] ||= new Set()).add(k));
    const muertos = Object.entries(CONTRATO).flatMap(([ev, ps]) => ps.filter((p) => !vistos[ev]?.has(p)).map((p) => `${ev}.${p}`));
    expect(muertos).toEqual([]);
  });

  it("la marca de prueba nunca viaja dentro de un evento", () => {
    expect(capturados.filter((e) => MARCA_PRUEBA in e && e[MARCA_PRUEBA] !== undefined)).toEqual([]);
  });

  it("el JSON para importar está al día con la definición", () => {
    const enDisco = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs/analytics/gtm-medicion-simple.json"), "utf8"));
    expect(enDisco).toEqual(buildContainer());
  });

  it("toda referencia {{…}} del JSON apunta a una variable definida o integrada", () => {
    const { variable, builtInVariable, tag, trigger } = buildContainer().containerVersion;
    const definidas = new Set([...variable.map((v) => v.name), ...builtInVariable.map((v) => v.name)]);
    const refs = (x) => [...JSON.stringify(x).matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]);
    // {{_event}} solo lo entiende GTM en el filtro de evento de un activador: en un
    // campo de variable queda vacío (pasó con la entrada del puente, 2026-10-07).
    const sinFiltros = [...tag, ...variable, ...trigger.map(({ customEventFilter, ...resto }) => resto)];
    expect(refs(sinFiltros).length).toBeGreaterThan(0);
    expect([...new Set(refs(sinFiltros))].filter((r) => !definidas.has(r))).toEqual([]);
    expect([...new Set(trigger.flatMap((t) => refs(t.customEventFilter)))]).toEqual(["_event"]);
  });
});

describe("GTM: debug_mode y puente", () => {
  const { tag, trigger, variable } = buildContainer().containerVersion;
  const tabla = (t) => t.parameter.find((p) => p.key === "eventSettingsTable" || p.key === "configSettingsTable").list;
  const valor = (t, nombre) => tabla(t).map((x) => Object.fromEntries(x.map.map((y) => [y.key, y.value]))).find((o) => o.parameter === nombre)?.parameterValue;

  it("cada etiqueta de GA4 manda debug_mode desde la marca de prueba, sin valor por defecto", () => {
    for (const t of tag) expect(valor(t, "debug_mode"), t.name).toBe(`{{DLV - ${MARCA_PRUEBA}}}`);
    const dlv = variable.find((v) => v.name === `DLV - ${MARCA_PRUEBA}`);
    expect(dlv.parameter.find((p) => p.key === "setDefaultValue").value).toBe("false");
  });

  it("la marca que lee GTM es la que empuja el cargador fuera de producción, y en producción no se empuja", () => {
    const correr = (hostname) => {
      const win = { dataLayer: [] };
      document.head.innerHTML = "<script></script>";
      new Function("window", "document", "location", buildIndianaGtmSnippet("GTM-X", { allowNonProduction: true }))(win, document, { hostname });
      return win.dataLayer;
    };
    expect(correr("localhost").some((e) => e[MARCA_PRUEBA] === true)).toBe(true);
    expect(correr("www.indiana.com.ar").some((e) => MARCA_PRUEBA in e)).toBe(false);
  });

  it("la visita automática de la etiqueta de Google sigue apagada", () => {
    expect(valor(tag.find((t) => t.type === "googtag"), "send_page_view")).toBe("false");
  });

  it("el puente se dispara con WhatsApp, teléfono y la postulación, usando el form_id que manda el formulario", () => {
    const puente = tag.find((t) => t.parameter.some((p) => p.key === "eventName" && p.value === "generate_lead"));
    const nombre = (id) => trigger.find((t) => t.triggerId === id).name;
    expect(puente.firingTriggerId.map(nombre).sort()).toEqual(["CE - form_submit (empleo)", "CE - phone_click", "CE - whatsapp_click"]);

    const empleo = trigger.find((t) => t.name === "CE - form_submit (empleo)");
    expect(empleo.filter[0].parameter.map((p) => p.value)).toEqual(["{{DLV - form_id}}", FORM_IDS.CAREERS]);
    // y es el valor que el formulario real empujó
    expect(capturados.find((e) => e.event === "form_submit").form_id).toBe(FORM_IDS.CAREERS);
  });

  it("los parámetros del puente existen en los eventos que lo disparan", () => {
    const origen = new Set(PUENTE.disparadores.map((d) => d.split(":")[0]).flatMap((ev) => CONTRATO[ev]));
    expect(PUENTE.parametros.filter((p) => !origen.has(p))).toEqual([]);
    expect(Object.keys(PUENTE.leadSource).sort()).toEqual([...new Set(PUENTE.disparadores.map((d) => d.split(":")[0]))].sort());
  });

  it("una sola etiqueta por evento (sin duplicados en GTM)", () => {
    const porEvento = {};
    for (const t of tag) {
      const ev = t.parameter.find((p) => p.key === "eventName")?.value;
      if (ev) porEvento[ev] = (porEvento[ev] || 0) + 1;
    }
    expect(Object.values(porEvento).every((n) => n === 1)).toBe(true);
  });
});

describe("aviso de compatibilidad generate_lead (para el GTM v9)", () => {
  it("el GTM nuevo no tiene activador para él: no se cuenta doble con el puente", () => {
    const { containerVersion } = buildContainer();
    const escuchados = containerVersion.trigger.flatMap((t) =>
      (t.customEventFilter || []).map((f) => f.parameter.find((p) => p.key === "arg1").value),
    );
    expect(escuchados).toContain(EVENTS.WHATSAPP_CLICK); // la lectura funciona
    expect(escuchados).not.toContain(LEAD_COMPAT.event);
  });

  it("sale de los mismos contactos que el puente, con el mismo lead_source", () => {
    expect(LEAD_COMPAT.event).toBe(PUENTE.evento);
    expect(LEAD_COMPAT.leadSource).toEqual(PUENTE.leadSource);
    expect(PUENTE.disparadores).toContain(`${EVENTS.FORM_SUBMIT}:${LEAD_COMPAT.formId}`);
  });

  it("con los emisores reales, cada contacto deja exactamente un aviso", () => {
    const contactos = todos.filter(
      (e) => e.event in LEAD_COMPAT.leadSource && (e.event !== EVENTS.FORM_SUBMIT || e.form_id === LEAD_COMPAT.formId),
    );
    const avisos = todos.filter((e) => e.event === LEAD_COMPAT.event);
    expect(avisos.length).toBe(contactos.length);
    expect(avisos.length).toBeGreaterThan(0);
  });
});
