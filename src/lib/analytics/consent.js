/**
 * Google Consent Mode v2 — default 'denied' + opt-in vía banner.
 *
 * Estrategia:
 * 1. ConsentBootstrap inyecta el snippet de "default" ANTES de que cargue GTM.
 * 2. El banner pide consentimiento. Si el usuario acepta, updateConsent('granted').
 * 3. La elección persiste en localStorage; en próximas visitas se reaplica
 *    el estado guardado en lugar del default.
 *
 * Hasta que el usuario decida, GA4 trabaja en modo "modelado" (sin cookies).
 */

import { pushGtagCommand } from "./dataLayer";

export const CONSENT_STORAGE_KEY = "indiana_consent_v1";
export const CONSENT_STATUS = Object.freeze({
  UNKNOWN: "unknown",
  GRANTED: "granted",
  DENIED: "denied",
  PARTIAL: "partial",
});

/**
 * Construye el snippet inline (string) que se mete en un <Script beforeInteractive>.
 * Decide el estado inicial leyendo localStorage SI ya hay decisión previa,
 * de lo contrario aplica defaults DENIED.
 *
 * Se ejecuta en el browser (beforeInteractive corre antes de hidratación pero en el cliente).
 */
export function buildConsentDefaultSnippet() {
  return `(function(){try{
window.dataLayer=window.dataLayer||[];
function gtag(){window.dataLayer.push(arguments);}
window.gtag=window.gtag||gtag;
var stored=null;
try{var raw=window.localStorage.getItem('${CONSENT_STORAGE_KEY}');if(raw){stored=JSON.parse(raw);}}catch(e){}
var analytics=(stored&&stored.analytics===true)?'granted':'denied';
var ads=(stored&&stored.ads===true)?'granted':'denied';
gtag('consent','default',{
ad_storage:ads,
ad_user_data:ads,
ad_personalization:ads,
analytics_storage:analytics,
functionality_storage:'granted',
security_storage:'granted',
wait_for_update:500
});
}catch(e){}})();`;
}

/**
 * Actualiza el consent state en runtime (cuando el user clickea aceptar/rechazar).
 * @param {{ analytics: boolean, ads: boolean }} prefs
 */
export function updateConsent({ analytics, ads }) {
  const a = analytics ? "granted" : "denied";
  const b = ads ? "granted" : "denied";
  pushGtagCommand("consent", "update", {
    ad_storage: b,
    ad_user_data: b,
    ad_personalization: b,
    analytics_storage: a,
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

/**
 * Lee el estado guardado del consent.
 * @returns {{analytics: boolean, ads: boolean, ts: number} | null}
 */
export function readStoredConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      analytics: parsed.analytics === true,
      ads: parsed.ads === true,
      ts: typeof parsed.ts === "number" ? parsed.ts : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Guarda la decisión y aplica updateConsent.
 * @param {{analytics: boolean, ads: boolean}} prefs
 */
export function persistConsent(prefs) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      analytics: prefs.analytics === true,
      ads: prefs.ads === true,
      ts: Date.now(),
    };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    updateConsent(payload);
  } catch {
    // Si localStorage falla (modo privado, cuotas), igual aplicamos consent en memoria.
    updateConsent(prefs);
  }
}

/**
 * Limpia la decisión persistida (útil para QA del banner en local).
 */
export function clearStoredConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* noop */
  }
}
