/**
 * Los únicos eventos que manda el sitio. Cada uno tiene su etiqueta en GTM
 * (GTM-TPJCFTBB), definida en scripts/gtm-container.mjs: un evento nuevo
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
});

export const ITEM_CATEGORY = Object.freeze({
  ZERO_KM: "0km",
  USADO: "usado",
  PLAN: "plan",
});
