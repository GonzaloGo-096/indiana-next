/**
 * Definición de NUESTRO contenedor GTM-TPJCFTBB. Es la fuente de verdad de lo
 * que tiene que haber en GTM; `gtm-container.mjs` la escribe en
 * docs/analytics/gtm-medicion-simple.json para importarla (T13).
 *
 * El test src/lib/analytics/__tests__/contrato-gtm.test.jsx compara esto con
 * lo que el código realmente manda: un evento nuevo en events.js sin etiqueta
 * acá, o un parámetro que el código manda y GTM no lee, hace fallar el check.
 *
 * No toca el contenedor de la agencia (GTM-M2J2LBRD).
 */

const ACCOUNT = "6351586507";
const CONTAINER = "250370263";
export const GA4 = "G-9HJ64VGVLH";
const INITIALIZATION_ALL_PAGES = "2147479573"; // activador integrado de GTM

/** Evento → parámetros que GTM lee del dataLayer y manda a GA4 con el mismo nombre. */
export const CONTRATO = Object.freeze({
  page_view: ["location", "page_location", "page_title"],
  view_item: ["location", "item_id", "item_name", "item_category"],
  whatsapp_click: ["location", "component_id", "lead_ref", "item_id", "item_name", "item_category"],
  phone_click: ["location", "component_id"],
  view_search_results: ["location", "results_count", "filters_count", "marca"],
  form_submit: ["location", "form_id"],
});

/**
 * Marca de prueba que empuja gtmLoader.js fuera de producción. GTM la manda a
 * GA4 como `debug_mode` en la etiqueta de Google y en cada evento: así se ve en
 * DebugView y el filtro "tráfico de desarrolladores" la deja fuera de los
 * informes. En producción no se empuja, la variable queda indefinida y GTM no
 * manda el parámetro (GA4 toma CUALQUIER valor de debug_mode como prueba).
 */
export const MARCA_PRUEBA = "analytics_test";

/**
 * Puente de transición (decisión del 2026-10-07): GTM sigue mandando
 * `generate_lead` en cada contacto para que el tablero viejo de Looker
 * ("Leads" = eventos generate_lead) siga funcionando y `generate_lead` siga
 * siendo el ÚNICO evento clave. Mismos disparadores que antes: WhatsApp,
 * teléfono y la postulación a empleo. Se borra en la Fase 7.
 */
export const PUENTE = Object.freeze({
  evento: "generate_lead",
  // "evento" o "evento:form_id". El form_id tiene que ser FORM_IDS.CAREERS de
  // src/lib/analytics/events.js (el test de contrato lo compara).
  disparadores: ["whatsapp_click", "phone_click", "form_submit:careers"],
  parametros: ["location", "component_id", "lead_ref", "item_id", "item_name", "item_category", "form_id"],
  leadSource: { whatsapp_click: "whatsapp", phone_click: "phone", form_submit: "form" },
});

const base = { accountId: ACCOUNT, containerId: CONTAINER };
const T = (key, value) => ({ type: "TEMPLATE", key, value });
const fila = (parametro, valor) => ({ type: "MAP", map: [T("parameter", parametro), T("parameterValue", valor)] });
const consent = { consentStatus: "NOT_SET" };

export function buildContainer({ exportTime = "2026-10-07 00:00:00" } = {}) {
  const eventos = Object.keys(CONTRATO);
  const nombres = [...new Set([...Object.values(CONTRATO).flat(), ...PUENTE.parametros, MARCA_PRUEBA])];

  const variable = [
    ...nombres.map((name, i) => ({
      ...base,
      variableId: String(100 + i),
      name: `DLV - ${name}`,
      type: "v",
      parameter: [
        { type: "INTEGER", key: "dataLayerVersion", value: "2" },
        { type: "BOOLEAN", key: "setDefaultValue", value: "false" },
        T("name", name),
      ],
    })),
    {
      ...base,
      variableId: "190",
      name: "Lead source (puente)",
      type: "smm",
      parameter: [
        { type: "BOOLEAN", key: "setDefaultValue", value: "false" },
        T("input", "{{_event}}"),
        {
          type: "LIST",
          key: "map",
          list: Object.entries(PUENTE.leadSource).map(([k, v]) => ({ type: "MAP", map: [T("key", k), T("value", v)] })),
        },
      ],
    },
  ];

  const trigger = [
    ...eventos.map((ev, i) => ({
      ...base,
      triggerId: String(200 + i),
      name: `CE - ${ev}`,
      type: "CUSTOM_EVENT",
      customEventFilter: [{ type: "EQUALS", parameter: [T("arg0", "{{_event}}"), T("arg1", ev)] }],
    })),
    // Disparadores del puente filtrados por form_id ("form_submit:careers").
    ...PUENTE.disparadores
      .filter((d) => d.includes(":"))
      .map((d, i) => {
        const [ev, formId] = d.split(":");
        return {
          ...base,
          triggerId: String(290 + i),
          name: `CE - ${ev} (${formId === "careers" ? "empleo" : formId})`,
          type: "CUSTOM_EVENT",
          customEventFilter: [{ type: "EQUALS", parameter: [T("arg0", "{{_event}}"), T("arg1", ev)] }],
          filter: [{ type: "EQUALS", parameter: [T("arg0", "{{DLV - form_id}}"), T("arg1", formId)] }],
        };
      }),
  ];
  const triggerDe = (ev) => trigger.find((t) => t.name === `CE - ${ev}`).triggerId;
  const triggerDelPuente = (d) => {
    if (!d.includes(":")) return triggerDe(d);
    const [ev, formId] = d.split(":");
    return trigger.find((t) => t.filter && t.customEventFilter[0].parameter[1].value === ev && t.filter[0].parameter[1].value === formId).triggerId;
  };

  const debug = fila("debug_mode", `{{DLV - ${MARCA_PRUEBA}}}`);
  const eventTag = (tagId, name, eventName, params, firingTriggerId, extra = []) => ({
    ...base,
    tagId,
    name,
    type: "gaawe",
    parameter: [
      { type: "BOOLEAN", key: "sendEcommerceData", value: "false" },
      T("eventName", eventName),
      { type: "LIST", key: "eventSettingsTable", list: [...params.map((p) => fila(p, `{{DLV - ${p}}}`)), ...extra, debug] },
      T("measurementIdOverride", GA4),
    ],
    firingTriggerId,
    tagFiringOption: "ONCE_PER_EVENT",
    consentSettings: consent,
  });

  const tag = [
    {
      ...base,
      tagId: "1",
      name: "GA4 - Base",
      type: "googtag",
      parameter: [
        T("tagId", GA4),
        {
          // send_page_view apagado a propósito: las visitas las manda el sitio
          // (PageViewTracker), también al navegar sin recargar. Prendido, la
          // primera se cuenta doble.
          type: "LIST",
          key: "configSettingsTable",
          list: [fila("send_page_view", "false"), debug],
        },
      ],
      firingTriggerId: [INITIALIZATION_ALL_PAGES],
      tagFiringOption: "ONCE_PER_EVENT",
      consentSettings: consent,
    },
    ...eventos.map((ev, i) => eventTag(String(300 + i), `GA4 - Event - ${ev}`, ev, CONTRATO[ev], [triggerDe(ev)])),
    eventTag(
      "390",
      "GA4 - Event - generate_lead (puente, se borra en Fase 7)",
      PUENTE.evento,
      PUENTE.parametros,
      PUENTE.disparadores.map(triggerDelPuente),
      [fila("lead_source", "{{Lead source (puente)}}")],
    ),
  ];

  return {
    exportFormatVersion: 2,
    exportTime,
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
}
