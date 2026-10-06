/**
 * Genera docs/analytics/gtm-medicion-simple.json: la definición completa de
 * NUESTRO contenedor GTM-TPJCFTBB para importar en GTM (Admin → Importar,
 * espacio de trabajo nuevo, "Reemplazar").
 *
 * Es la fuente de verdad de lo que tiene que haber en GTM: si se agrega un
 * evento en src/lib/analytics/events.js, se agrega acá y se vuelve a importar.
 * No toca el contenedor de la agencia (GTM-M2J2LBRD).
 *
 *   node scripts/gtm-container.mjs
 */
import fs from "node:fs";

const ACCOUNT = "6351586507";
const CONTAINER = "250370263";
const GA4 = "G-9HJ64VGVLH";
const INITIALIZATION_ALL_PAGES = "2147479573"; // activador integrado de GTM

// evento → parámetros que viajan a GA4 (todos salen del dataLayer con el mismo nombre)
const EVENTOS = {
  page_view: ["location", "page_location", "page_title"],
  view_item: ["location", "item_id", "item_name", "item_category"],
  whatsapp_click: ["location", "component_id", "lead_ref", "item_id", "item_name", "item_category"],
  phone_click: ["location", "component_id"],
  view_search_results: ["location", "results_count", "filters_count", "marca"],
  form_submit: ["location", "form_id"],
};

const base = { accountId: ACCOUNT, containerId: CONTAINER };
const T = (key, value) => ({ type: "TEMPLATE", key, value });
const params = [...new Set(Object.values(EVENTOS).flat())];

const variable = params.map((name, i) => ({
  ...base,
  variableId: String(100 + i),
  name: `DLV - ${name}`,
  type: "v",
  parameter: [
    { type: "INTEGER", key: "dataLayerVersion", value: "2" },
    { type: "BOOLEAN", key: "setDefaultValue", value: "false" },
    T("name", name),
  ],
}));

const nombres = Object.keys(EVENTOS);
const trigger = nombres.map((ev, i) => ({
  ...base,
  triggerId: String(200 + i),
  name: `CE - ${ev}`,
  type: "CUSTOM_EVENT",
  customEventFilter: [{ type: "EQUALS", parameter: [T("arg0", "{{_event}}"), T("arg1", ev)] }],
}));

const tag = [
  {
    ...base,
    tagId: "1",
    name: "GA4 - Base",
    type: "googtag",
    parameter: [
      T("tagId", GA4),
      {
        // Apagado a propósito: las visitas las manda el sitio (PageViewTracker),
        // también al navegar sin recargar. Prendido, la primera se cuenta doble.
        type: "LIST",
        key: "configSettingsTable",
        list: [{ type: "MAP", map: [T("parameter", "send_page_view"), T("parameterValue", "false")] }],
      },
    ],
    firingTriggerId: [INITIALIZATION_ALL_PAGES],
    tagFiringOption: "ONCE_PER_EVENT",
    consentSettings: { consentStatus: "NOT_SET" },
  },
  ...nombres.map((ev, i) => ({
    ...base,
    tagId: String(300 + i),
    name: `GA4 - Event - ${ev}`,
    type: "gaawe",
    parameter: [
      { type: "BOOLEAN", key: "sendEcommerceData", value: "false" },
      T("eventName", ev),
      {
        type: "LIST",
        key: "eventSettingsTable",
        list: EVENTOS[ev].map((p) => ({
          type: "MAP",
          map: [T("parameter", p), T("parameterValue", `{{DLV - ${p}}}`)],
        })),
      },
      T("measurementIdOverride", GA4),
    ],
    firingTriggerId: [String(200 + i)],
    tagFiringOption: "ONCE_PER_EVENT",
    consentSettings: { consentStatus: "NOT_SET" },
  })),
];

const out = {
  exportFormatVersion: 2,
  exportTime: new Date().toISOString().slice(0, 19).replace("T", " "),
  containerVersion: {
    path: `accounts/${ACCOUNT}/containers/${CONTAINER}/versions/0`,
    ...base,
    containerVersionId: "0",
    container: { path: `accounts/${ACCOUNT}/containers/${CONTAINER}`, ...base, name: "www.indiana.com.ar", publicId: "GTM-TPJCFTBB", usageContext: ["WEB"] },
    tag,
    trigger,
    variable,
    builtInVariable: [
      { ...base, type: "PAGE_URL", name: "Page URL" },
      { ...base, type: "PAGE_HOSTNAME", name: "Page Hostname" },
      { ...base, type: "PAGE_PATH", name: "Page Path" },
      { ...base, type: "REFERRER", name: "Referrer" },
      { ...base, type: "EVENT", name: "Event" },
    ],
  },
};

fs.writeFileSync("docs/analytics/gtm-medicion-simple.json", JSON.stringify(out, null, 2) + "\n");
console.log(`tags ${tag.length} · activadores ${trigger.length} · variables ${variable.length}`);
