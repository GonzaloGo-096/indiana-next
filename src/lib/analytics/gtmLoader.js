/**
 * Qué carga en qué dominio: nuestro contenedor de GTM (GTM-TPJCFTBB), el de
 * la agencia y el Pixel de Meta.
 *
 * Solo carga en el dominio de producción. En cualquier otro (localhost,
 * versiones de prueba de Vercel) carga únicamente si se pidió a propósito con
 * NEXT_PUBLIC_ANALYTICS_TEST=true, y en ese caso marca la visita como prueba
 * (`analytics_test`): GTM la manda a GA4 con debug_mode y el filtro de
 * "tráfico de desarrolladores" la deja fuera de los informes.
 *
 * Por qué: hasta el 2026-10 el desarrollo local mandaba eventos al GA4 real.
 * La decisión se toma en el navegador (location.hostname) porque el mismo
 * build sirve a producción y a sus alias.
 *
 * El contenedor de la agencia y el Pixel cargan solo en producción, sin
 * excepción de prueba (soloEnProduccion).
 */

// Solo estos dos dominios: un subdominio (por ejemplo staging.indiana.com.ar)
// apuntado a una versión de prueba mandaría datos reales sin marca de prueba.
export const PRODUCTION_HOST = /^(www\.)?indiana\.com\.ar$/;

export function isProductionHost(hostname) {
  return PRODUCTION_HOST.test(String(hostname || ""));
}

/**
 * @param {string} gtmId
 * @param {{ allowNonProduction?: boolean }} [opts] - solo `true` habilita la carga fuera de
 *   producción; un string como "false" no (antes sí la habilitaba)
 * @returns {string} script en línea para <Script>
 */
export function buildIndianaGtmSnippet(gtmId, { allowNonProduction = false } = {}) {
  return `(function(){
var prod=${PRODUCTION_HOST}.test(location.hostname);
if(!prod&&!${allowNonProduction === true ? "true" : "false"})return;
window.dataLayer=window.dataLayer||[];
if(!prod)window.dataLayer.push({analytics_test:true});
${cargarGtm(gtmId)}
})();`;
}

/** El snippet oficial de GTM, con el id escapado. */
function cargarGtm(gtmId) {
  const id = JSON.stringify(String(gtmId));
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${id});`;
}

/**
 * Envuelve un script para que corra solo en el dominio de producción.
 *
 * Para lo que no es nuestro: el GTM de la agencia (conversiones de Ads y
 * remarketing) y el Pixel de Meta no tienen marca de prueba, así que un clic
 * en una copia de Vercel o en local les llegaba como un contacto real.
 * Vercel tiene sus IDs también en Preview. Comprobado en el código y en la
 * configuración el 2026-10-26.
 *
 * @param {string} script
 * @returns {string}
 */
export function soloEnProduccion(script) {
  return `(function(){
if(!${PRODUCTION_HOST}.test(location.hostname))return;
${script}
})();`;
}

/**
 * @param {string} gtmId - contenedor de la agencia (GTM-M2J2LBRD)
 * @returns {string} script en línea para <Script>
 */
export function buildMarketingGtmSnippet(gtmId) {
  return soloEnProduccion(cargarGtm(gtmId));
}
