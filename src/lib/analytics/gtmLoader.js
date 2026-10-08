/**
 * Cargador de NUESTRO contenedor de GTM (GTM-TPJCFTBB).
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
 * El contenedor de la agencia y el Pixel NO pasan por acá: se cargan igual que
 * siempre desde MarketingTracking.
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
  const id = JSON.stringify(String(gtmId));
  return `(function(){
var prod=${PRODUCTION_HOST}.test(location.hostname);
if(!prod&&!${allowNonProduction === true ? "true" : "false"})return;
window.dataLayer=window.dataLayer||[];
if(!prod)window.dataLayer.push({analytics_test:true});
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${id});
})();`;
}
