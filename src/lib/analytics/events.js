/**
 * Los únicos eventos que manda el sitio. Cada uno tiene su etiqueta en GTM
 * (GTM-TPJCFTBB), definida en scripts/gtm-definition.mjs: un evento nuevo
 * acá sin etiqueta allá no llega a GA4.
 */
export const EVENTS = Object.freeze({
  PAGE_VIEW: "page_view",
  VIEW_ITEM: "view_item",
  WHATSAPP_CLICK: "whatsapp_click",
  PHONE_CLICK: "phone_click",
  VIEW_SEARCH_RESULTS: "view_search_results",
  FORM_SUBMIT: "form_submit",
});

/**
 * form_id de cada formulario. El puente de GTM cuenta como generate_lead el
 * form_submit con form_id = CAREERS: cambiar el valor sin cambiar GTM deja de
 * contar postulaciones (el test de contrato lo detecta).
 */
export const FORM_IDS = Object.freeze({
  CAREERS: "careers",
});

/**
 * Aviso de compatibilidad con el GTM publicado (v9), que cuenta "Leads" con el
 * generate_lead que empuja el sitio. track() lo empuja después de cada
 * contacto, con los mismos datos y `lead_source`. El GTM nuevo no tiene
 * activador para este evento (lo arma su puente), así que no cuenta doble: el
 * test de contrato lo exige. Con esto, código nuevo + GTM v9 no deja "Leads" en
 * 0 y el día de salida el orden entre GTM y código no importa (auditoría de
 * releases del 2026-10-26). Se saca cuando la v9 ya no pueda volver.
 */
export const LEAD_COMPAT = Object.freeze({
  event: "generate_lead",
  leadSource: Object.freeze({
    [EVENTS.WHATSAPP_CLICK]: "whatsapp",
    [EVENTS.PHONE_CLICK]: "phone",
    [EVENTS.FORM_SUBMIT]: "form",
  }),
  // Solo la postulación es un form_submit que cuenta como lead.
  formId: FORM_IDS.CAREERS,
});

export const LOCATIONS = Object.freeze({
  HOME: "home",
  OKM_LIST: "okm_list",
  OKM_DETAIL: "okm_detail",
  USADOS_LIST: "usados_list",
  USADOS_DETAIL: "usados_detail",
  PLANES_LIST: "planes_list",
  PLAN_DETAIL: "plan_detail",
  POSTVENTA: "postventa",
  CAREERS: "careers",
  // Rutas fuera de estas secciones (404, páginas sueltas).
  OTHER: "other",
});

export const ITEM_CATEGORY = Object.freeze({
  ZERO_KM: "0km",
  USADO: "usado",
  PLAN: "plan",
});
