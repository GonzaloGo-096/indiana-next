/**
 * Barrel del módulo analytics.
 * Importar desde "@/lib/analytics" en componentes y hooks.
 */

export { pushDataLayer } from "./dataLayer";
export {
  EVENTS,
  SOURCES,
  LOCATIONS,
  ITEM_LIST,
  LEAD_SOURCES,
  ITEM_CATEGORY,
  REQUIRED_CONTEXT_EVENTS,
  VALID_SOURCES,
  VALID_LOCATIONS,
} from "./events";
export {
  buildItemParamsFromAuto,
  buildItemParamsFromPlan,
  buildItemParamsFromUsado,
  buildSearchFiltersParams,
  hashPhoneNumber,
} from "./params";
export {
  CONSENT_STORAGE_KEY,
  CONSENT_STATUS,
  buildConsentDefaultSnippet,
  updateConsent,
  readStoredConsent,
  persistConsent,
  clearStoredConsent,
} from "./consent";
export { locationFromPathname } from "./locationFromPath";
