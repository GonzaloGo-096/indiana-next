/**
 * Catálogo congelado de eventos y enums para tracking GA4 vía GTM.
 *
 * Reglas:
 * - Nunca hardcodear strings en componentes; siempre importar desde acá.
 * - EVENTS estándar GA4 mantienen el nombre exacto que GA4 espera.
 * - SOURCES y LOCATIONS son enums acotados para garantizar consistencia
 *   en reportes (filtrar/agrupar sin sorpresas).
 *
 * Para agregar un evento nuevo: ver README de tracking, sección
 * "Cómo agregar un evento nuevo".
 */

export const EVENTS = Object.freeze({
  // Estándar GA4 (nombre EXACTO requerido)
  PAGE_VIEW: "page_view",
  VIEW_ITEM: "view_item",
  SELECT_ITEM: "select_item",
  VIEW_ITEM_LIST: "view_item_list",
  VIEW_SEARCH_RESULTS: "view_search_results",
  GENERATE_LEAD: "generate_lead",
  FORM_START: "form_start",
  FORM_SUBMIT: "form_submit",

  // Custom (snake_case GA4-style)
  WHATSAPP_CLICK: "whatsapp_click",
  PHONE_CLICK: "phone_click",
  EMAIL_CLICK: "email_click",
  CTA_CLICK: "cta_click",
  GALLERY_OPEN: "gallery_open",
  GALLERY_NAVIGATE: "gallery_navigate",
  FILTER_APPLIED: "filter_applied",
  SORT_APPLIED: "sort_applied",
  CAROUSEL_INTERACT: "carousel_interact",
  NAV_TOGGLE: "nav_toggle",
  SCROLL_DEPTH: "scroll_depth",
});

export const SOURCES = Object.freeze({
  FLOATING: "floating",
  INLINE: "inline",
  CARD: "card",
  NAV: "nav",
  FOOTER: "footer",
  HERO: "hero",
  BANNER: "banner",
  GALLERY: "gallery",
  FORM: "form",
  CAROUSEL: "carousel",
  BREADCRUMB: "breadcrumb",
  MODAL: "modal",
  LISTING_PAGE: "listing_page",
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
  NOT_FOUND: "404",
  MAINTENANCE: "maintenance",
});

export const ITEM_LIST = Object.freeze({
  HOME_FEATURED: "home_featured",
  OKM_GRID: "0km",
  USADOS_GRID: "usados",
  PLANES_GRID: "planes",
  SIMILAR: "similar",
});

export const LEAD_SOURCES = Object.freeze({
  WHATSAPP: "whatsapp",
  FORM: "form",
  PHONE: "phone",
  EMAIL: "email",
});

export const ITEM_CATEGORY = Object.freeze({
  ZERO_KM: "0km",
  USADO: "usado",
  PLAN: "plan",
});

/**
 * Eventos que requieren { source, location, component_id } como params obligatorios.
 * pushDataLayer warnea en dev si alguno falta.
 */
export const REQUIRED_CONTEXT_EVENTS = Object.freeze(
  new Set([
    EVENTS.WHATSAPP_CLICK,
    EVENTS.PHONE_CLICK,
    EVENTS.EMAIL_CLICK,
    EVENTS.CTA_CLICK,
    EVENTS.GALLERY_OPEN,
    EVENTS.GALLERY_NAVIGATE,
    EVENTS.NAV_TOGGLE,
    EVENTS.CAROUSEL_INTERACT,
    EVENTS.SELECT_ITEM,
  ]),
);

/**
 * Mapeo invertido para validar enums (los wrappers UI los chequean en dev).
 */
export const VALID_SOURCES = Object.freeze(new Set(Object.values(SOURCES)));
export const VALID_LOCATIONS = Object.freeze(new Set(Object.values(LOCATIONS)));
