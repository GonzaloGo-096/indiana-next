/**
 * Datos personales en la dirección de la página.
 *
 * Un link de campaña (mail, formularios de Meta) puede traer ?email=, ?name=,
 * ?tel=... La etiqueta de Google adjunta la dirección del navegador a TODOS los
 * eventos, no solo a la visita, y GA4 solo oculta los emails. Por eso se limpia
 * la dirección en la barra del navegador antes de que cargue cualquier
 * etiqueta (la nuestra, la de la agencia y el Pixel): así sale limpia para
 * todos (auditoría del 2026-10-07).
 *
 * Se sacan solo los parámetros con nombre de dato personal; utm_*, gclid y los
 * filtros del listado quedan, porque de ahí GA4 lee la campaña.
 */

// Por pedazo (user_email, nombreApellido) o exacto para los nombres cortos
// que como pedazo atraparían de más (name, tel, cel).
const PII_QUERY_SOURCE =
  "mail|correo|phone|tel[eé]fono|celular|whats|dni|nombre|apellido|direcci|address|^(?:f|l|first_?|last_?|full_?)?name$|^(?:tel|cel|mobile|movil|m[oó]vil)$";
export const PII_QUERY = new RegExp(PII_QUERY_SOURCE, "i");

function clave(parte) {
  const k = parte.split("=")[0];
  try {
    return decodeURIComponent(k.replace(/\+/g, " "));
  } catch {
    // Clave mal codificada: se evalúa como vino.
    return k;
  }
}

/** Si el hash trae pares clave=valor con forma de dato personal (#email=...). */
function hashConDatos(hash) {
  return hash.slice(1).split("&").some((p) => p.includes("=") && PII_QUERY.test(clave(p)));
}

/**
 * La URL sin parámetros que parezcan datos personales. Pedazo por pedazo y sin
 * volver a codificar: el resto queda tal cual llegó.
 * @param {string} href
 * @returns {string | undefined} undefined si la URL no se puede leer
 */
export function urlSinDatosPersonales(href) {
  try {
    const u = new URL(href);
    const partes = u.search.slice(1).split("&").filter(Boolean);
    const quedan = partes.filter((p) => !PII_QUERY.test(clave(p)));
    const hashMalo = hashConDatos(u.hash);
    if (quedan.length === partes.length && !hashMalo) return u.toString();
    u.search = quedan.length ? `?${quedan.join("&")}` : "";
    if (hashMalo) u.hash = "";
    return u.toString();
  } catch {
    // Una URL que no se puede leer no se manda.
    return undefined;
  }
}

/**
 * Script en línea que limpia la barra del navegador (history.replaceState, sin
 * recargar ni agregar una entrada al historial). Misma regla que
 * urlSinDatosPersonales: el test los compara.
 */
export function buildUrlCleanSnippet() {
  return `(function(){try{
var re=new RegExp(${JSON.stringify(PII_QUERY_SOURCE)},"i");
function k(p){var x=p.split("=")[0];try{return decodeURIComponent(x.replace(/\\+/g," "));}catch(e){return x;}}
var l=window.location,s=l.search.slice(1).split("&").filter(Boolean),q=s.filter(function(p){return !re.test(k(p));});
var h=l.hash.slice(1).split("&").some(function(p){return p.indexOf("=")>-1&&re.test(k(p));});
if(q.length===s.length&&!h)return;
window.history.replaceState(window.history.state,"",l.pathname+(q.length?"?"+q.join("&"):"")+(h?"":l.hash));
}catch(e){}})();`;
}
