/**
 * Google Consent Mode v2 — default 'denied' + opt-in vía banner.
 *
 * Estrategia:
 * 1. ConsentBootstrap inyecta el snippet de "default" ANTES de que cargue GTM.
 * 2. El banner pide consentimiento. Si el usuario acepta, updateConsent('granted').
 * 3. La elección persiste en localStorage; en próximas visitas se reaplica
 *    el estado guardado en lugar del default.
 *
 * Hasta que el usuario acepte, GA4 recibe avisos sin cookies que NO aparecen en
 * los informes: con la identidad "basada en dispositivo" no hay modelado, y el
 * modelado igual pide un volumen (miles de usuarios por día) que el sitio no tiene.
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
  aplicarAlPixel(ads ? "grant" : "revoke");
}

/**
 * El Pixel de Meta sigue la misma elección que los anuncios de Google
 * (metaPixel.js lo deja en pausa hasta que se acepta).
 *
 * Si el script de Meta todavía no terminó de bajar, el comando queda en su
 * cola detrás del "revoke" inicial, y al cargar Meta frena en el revoke y no lo
 * aplica (nuxt/scripts#928). Por eso se espera a que el script esté cargado
 * (fbq.callMethod) y recién ahí se manda.
 */
export const PIXEL_ESPERA_MS = 15000;

function aplicarAlPixel(estado) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  const mandar = () => {
    try {
      window.fbq("consent", estado);
    } catch {
      // Si el Pixel falla, el consentimiento de Google ya quedó aplicado.
    }
  };
  if (window.fbq.callMethod || !Array.isArray(window.fbq.queue)) return mandar();
  const desde = Date.now();
  const t = setInterval(() => {
    if (window.fbq?.callMethod) {
      clearInterval(t);
      mandar();
    } else if (Date.now() - desde > PIXEL_ESPERA_MS) {
      // No cargó (bloqueador, sin red): no hay Pixel al que avisarle.
      clearInterval(t);
    }
  }, 200);
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
    // localStorage bloqueado (modo privado) o valor roto: se trata como sin
    // decisión y el banner vuelve a preguntar.
    return null;
  }
}

/**
 * Guarda la decisión y aplica updateConsent.
 * @param {{analytics: boolean, ads: boolean}} prefs
 */
export function persistConsent(prefs) {
  if (typeof window === "undefined") return;
  const analytics = prefs.analytics === true;
  const ads = prefs.ads === true;
  const yaMedia = analyticsAceptada();
  try {
    const payload = { analytics, ads, ts: Date.now() };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    updateConsent(payload);
  } catch {
    // Si localStorage falla (modo privado, cuotas), igual aplicamos consent en memoria.
    aceptadaSinGuardar = analytics;
    updateConsent({ analytics, ads });
  }
  if (analytics && !yaMedia) for (const fn of alAceptarAnalitica) fn();
}

// Con localStorage bloqueado no queda nada guardado: sin este recuerdo, cada
// "Aceptar" volvía a reenviar la página como si fuera la primera vez.
let aceptadaSinGuardar = false;

/** Si la persona aceptó la medición (guardado, o en memoria si localStorage falla). */
export function analyticsAceptada() {
  return readStoredConsent()?.analytics === true || aceptadaSinGuardar;
}

const alAceptarAnalitica = new Set();

/**
 * Avisa cuando la analítica pasa de no aceptada a aceptada, después de
 * aplicar el consentimiento.
 *
 * Lo enviado antes de aceptar salió sin cookies y no entra a los informes, y
 * gtag no lo reenvía (comprobado con red el 2026-10-26): quien aceptaba a los
 * pocos segundos quedaba sin página de entrada y sin el auto que miraba.
 * PageViewTracker escucha esto para volver a contar la página actual.
 *
 * Depende de que lo enviado sin cookies NO aparezca en los informes, que es
 * así con la identidad "basada en dispositivo". Si GA4 pasa a "Mezclada" (o
 * empieza a modelar), quien acepta tarde contaría doble: sacar este reenvío.
 *
 * @param {() => void} fn
 * @returns {() => void} para dejar de escuchar
 */
export function onAnalyticsGranted(fn) {
  alAceptarAnalitica.add(fn);
  return () => alAceptarAnalitica.delete(fn);
}

/**
 * Limpia la decisión persistida (útil para QA del banner en local).
 */
export function clearStoredConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Solo se usa para pruebas del banner: si localStorage está bloqueado no
    // hay nada guardado que borrar.
  }
}
