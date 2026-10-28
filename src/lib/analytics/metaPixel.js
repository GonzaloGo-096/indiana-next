/**
 * Cargador del Pixel de Meta (el ID es de la agencia; el código que lo carga
 * es nuestro, en MarketingTracking).
 *
 * Respeta la elección de cookies: hasta que la persona acepta las de
 * publicidad, el Pixel queda en pausa (`fbq('consent','revoke')`) y no manda
 * nada a Meta. Al aceptar, consent.js lo prende con `fbq('consent','grant')`.
 * Antes disparaba PageView aunque la persona rechazara (riesgo legal para
 * Indiana con la Ley 25.326; decisión del 2026-10-07).
 *
 * Los eventos son los mismos que antes (init + PageView): la agencia ve lo
 * mismo, solo de quienes aceptan.
 */

import { CONSENT_STORAGE_KEY } from "./consent";
import { soloEnProduccion } from "./gtmLoader";

/**
 * Solo carga en el dominio de producción (ver soloEnProduccion).
 *
 * @param {string} pixelId
 * @returns {string} script en línea para <Script>
 */
export function buildMetaPixelSnippet(pixelId) {
  const id = JSON.stringify(String(pixelId));
  return soloEnProduccion(`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
(function(){var ok=false;try{var r=JSON.parse(localStorage.getItem('${CONSENT_STORAGE_KEY}')||'null');ok=!!(r&&r.ads===true);}catch(e){}
if(!ok)fbq('consent','revoke');})();
fbq('init',${id});
fbq('track','PageView');`);
}
