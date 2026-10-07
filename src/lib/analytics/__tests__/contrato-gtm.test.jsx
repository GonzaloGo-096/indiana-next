/**
 * @vitest-environment jsdom
 *
 * Correspondencia código ↔ GTM. Antes de la medición simple, 8 eventos se
 * mandaban desde el código y nunca llegaban a GA4 porque no tenían etiqueta.
 * Este test hace fallar el check si vuelve a pasar algo así:
 *  - un evento del código sin etiqueta en GTM (o al revés);
 *  - un parámetro que el código manda y GTM no lee;
 *  - un parámetro que GTM lee y ningún código manda;
 *  - el JSON para importar desactualizado respecto de la definición;
 *  - una etiqueta de GA4 sin debug_mode, o una marca de prueba distinta a la que
 *    empuja el cargador.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { CONTRATO, PUENTE, MARCA_PRUEBA, buildContainer } from "../../../../scripts/gtm-definition.mjs";
import { EVENTS } from "../events";
import { track } from "../dataLayer";
import { buildIndianaGtmSnippet } from "../gtmLoader";
import { buildItemParamsFromAuto, buildItemParamsFromUsado, buildItemParamsFromPlan } from "../params";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  useSearchParams: () => new URLSearchParams(""),
}));

const { default: WhatsAppLink } = await import("@/components/analytics/WhatsAppLink");
const { default: TelLink } = await import("@/components/analytics/TelLink");
const { default: ItemViewTracker } = await import("@/components/analytics/ItemViewTracker");
const { default: PageViewTracker, SETTLE_MS } = await import("@/components/analytics/PageViewTracker");
const { buildSearchEventParams } = await import("@/app/(site)/usados/vehiculos/useVehiclesList");

const RAIZ = path.resolve(__dirname, "../../../..");
const enviadas = (e) => Object.keys(e).filter((k) => k !== "event" && e[k] !== undefined);

/** Lo que el código real empuja al dataLayer, ejerciendo cada emisor. */
function capturarTodo() {
  window.dataLayer = [];
  document.title = "Peugeot 208 0km | Peugeot Indiana"; // el sitio siempre tiene título; jsdom no
  window.history.pushState({}, "", "/0km/208");
  nav.pathname = "/0km/208";
  vi.useFakeTimers();
  render(<PageViewTracker />);
  act(() => vi.advanceTimersByTime(SETTLE_MS));
  vi.useRealTimers();

  const auto = buildItemParamsFromAuto({ slug: "208", titulo: "208" });
  render(<ItemViewTracker item={auto} />);
  render(<ItemViewTracker item={buildItemParamsFromUsado({ _id: "6ab26f0973c7ebf8ffbe4285", marca: "Peugeot", modelo: "2008", anio: 2020 })} />);
  render(<ItemViewTracker item={buildItemParamsFromPlan({ id: "easy", nombre: "Easy", modelo: "208" })} />);

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

  track(EVENTS.VIEW_SEARCH_RESULTS, { results_count: 3, ...buildSearchEventParams({ marca: ["Ford"], caja: ["Manual"] }) });

  return window.dataLayer.filter((e) => e && e.event);
}

/** El form_submit sale de CareersForm, que necesita un envío real: se lee la llamada del código. */
function paramsDelFormulario() {
  const src = fs.readFileSync(path.join(RAIZ, "src/components/careers/CareersForm.jsx"), "utf8");
  const m = src.match(/track\(EVENTS\.FORM_SUBMIT,\s*\{([^}]*)\}\)/);
  if (!m) throw new Error("CareersForm ya no llama a track(EVENTS.FORM_SUBMIT, {...}): revisar este test");
  return ["location", ...m[1].split(",").map((p) => p.split(":")[0].trim()).filter(Boolean)];
}

beforeEach(() => {
  vi.spyOn(console, "debug").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("contrato código ↔ GTM", () => {
  it("los eventos del código son exactamente los que tienen etiqueta en GTM", () => {
    expect([...Object.values(EVENTS)].sort()).toEqual(Object.keys(CONTRATO).sort());
  });

  it("todo parámetro que el código manda lo lee GTM", () => {
    const sobrantes = [];
    for (const e of capturarTodo()) {
      for (const k of enviadas(e)) if (!CONTRATO[e.event]?.includes(k)) sobrantes.push(`${e.event}.${k}`);
    }
    for (const k of paramsDelFormulario()) if (!CONTRATO.form_submit.includes(k)) sobrantes.push(`form_submit.${k}`);
    expect(sobrantes).toEqual([]);
  });

  it("todo parámetro que GTM lee lo manda algún código", () => {
    const vistos = {};
    for (const e of capturarTodo()) (vistos[e.event] ||= new Set()) && enviadas(e).forEach((k) => vistos[e.event].add(k));
    vistos.form_submit = new Set(paramsDelFormulario());
    const muertos = Object.entries(CONTRATO).flatMap(([ev, ps]) => ps.filter((p) => !vistos[ev]?.has(p)).map((p) => `${ev}.${p}`));
    expect(muertos).toEqual([]);
  });

  it("el JSON para importar está al día con la definición", () => {
    const enDisco = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs/analytics/gtm-medicion-simple.json"), "utf8"));
    expect(enDisco).toEqual(buildContainer());
  });
});

describe("GTM: debug_mode y puente", () => {
  const { tag, trigger, variable } = buildContainer().containerVersion;
  const tabla = (t) => t.parameter.find((p) => p.key === "eventSettingsTable" || p.key === "configSettingsTable").list;
  const valor = (t, nombre) => tabla(t).map((m) => Object.fromEntries(m.map.map((x) => [x.key, x.value]))).find((o) => o.parameter === nombre)?.parameterValue;

  it("cada etiqueta de GA4 manda debug_mode desde la marca de prueba, y nada más lo prende", () => {
    for (const t of tag) expect(valor(t, "debug_mode"), t.name).toBe(`{{DLV - ${MARCA_PRUEBA}}}`);
    const dlv = variable.find((v) => v.name === `DLV - ${MARCA_PRUEBA}`);
    expect(dlv.parameter.find((p) => p.key === "setDefaultValue").value).toBe("false");
  });

  it("la marca que lee GTM es la que empuja el cargador fuera de producción", () => {
    const win = { dataLayer: [] };
    document.head.innerHTML = "<script></script>";
    new Function("window", "document", "location", buildIndianaGtmSnippet("GTM-X", { allowNonProduction: true }))(win, document, { hostname: "localhost" });
    expect(win.dataLayer.some((e) => e[MARCA_PRUEBA] === true)).toBe(true);
  });

  it("la visita automática de la etiqueta de Google sigue apagada", () => {
    expect(valor(tag.find((t) => t.type === "googtag"), "send_page_view")).toBe("false");
  });

  it("el puente manda generate_lead con WhatsApp, teléfono y postulación, con parámetros que existen", () => {
    const puente = tag.find((t) => t.parameter.some((p) => p.key === "eventName" && p.value === "generate_lead"));
    const nombreTrigger = (id) => trigger.find((t) => t.triggerId === id).name;
    expect(puente.firingTriggerId.map(nombreTrigger).sort()).toEqual(
      ["CE - whatsapp_click", "CE - phone_click", "CE - form_submit (empleo)"].sort(),
    );
    const empleo = trigger.find((t) => t.name === "CE - form_submit (empleo)");
    expect(empleo.filter[0].parameter.map((p) => p.value)).toEqual(["{{DLV - form_id}}", "careers"]);

    const origen = new Set(["whatsapp_click", "phone_click", "form_submit"].flatMap((ev) => CONTRATO[ev]));
    expect(PUENTE.parametros.filter((p) => !origen.has(p))).toEqual([]);
    expect(Object.keys(PUENTE.leadSource).sort()).toEqual(["form_submit", "phone_click", "whatsapp_click"]);
  });

  it("solo hay una etiqueta por evento (sin duplicados en GTM)", () => {
    const porEvento = {};
    for (const t of tag) {
      const ev = t.parameter.find((p) => p.key === "eventName")?.value;
      if (ev) porEvento[ev] = (porEvento[ev] || 0) + 1;
    }
    expect(Object.values(porEvento).every((n) => n === 1)).toBe(true);
  });
});
