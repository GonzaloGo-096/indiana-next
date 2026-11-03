/**
 * gtm-publicado.mjs - Compara el contenedor PUBLICADO en GTM con el contrato.
 *
 * El test de contrato compara el código con scripts/gtm-definition.mjs, y el
 * JSON para importar con esa misma definición. Nada comprobaba lo que de
 * verdad está publicado. gtm.js es público y trae la configuración como
 * texto: se buscan las piezas con su forma exacta, no las palabras sueltas
 * (nombres como "page_view" o "generate_lead" también están dentro de la
 * librería de Google, y buscarlos sueltos daba "ok" en cualquier contenedor;
 * revisión independiente del 2026-10-27):
 *   - activador por evento:        "arg1":"<evento>"
 *   - etiqueta que manda el evento: "vtp_eventName":"<evento>"
 *   - variable de la capa de datos: "vtp_name":"<clave>"
 *
 * Además exige que NO haya activador de generate_lead: el sitio empuja ese
 * evento solo para la v9 (aviso de compatibilidad) y, si el contenedor nuevo
 * lo escuchara, se contaría doble con el puente.
 *
 *   node scripts/gtm-publicado.mjs            contra GTM-TPJCFTBB
 *   node scripts/gtm-publicado.mjs GTM-XXXX
 *
 * Correrlo 15 minutos después de publicar (gtm.js queda en caché). Sale con
 * código 1 si falta algo.
 */
import { CONTRATO, PUENTE, MARCA_PRUEBA, GA4 } from "./gtm-definition.mjs";

// La versión publicada antes de la medición simple: la nueva tiene que ser posterior.
const VERSION_VIEJA = 9;

const ID = process.argv[2] || "GTM-TPJCFTBB";
const r = await fetch(`https://www.googletagmanager.com/gtm.js?id=${ID}`, {
  signal: AbortSignal.timeout(20000),
});
if (!r.ok) {
  console.log(`  gtm.js respondió ${r.status}`);
  process.exit(1);
}
const js = await r.text();
const version = Number(js.match(/"version":"(\d+)"/)?.[1] ?? 0);

const claves = [...new Set([...Object.values(CONTRATO).flat(), MARCA_PRUEBA])];
const chequeos = [
  [`versión posterior a la ${VERSION_VIEJA}`, `versión ${version}`, version > VERSION_VIEJA],
  ...Object.keys(CONTRATO).flatMap((ev) => [
    ["activador", ev, js.includes(`"arg1":"${ev}"`)],
    ["etiqueta", ev, js.includes(`"vtp_eventName":"${ev}"`)],
  ]),
  ["puente", PUENTE.evento, js.includes(`"vtp_eventName":"${PUENTE.evento}"`)],
  [`sin activador de ${PUENTE.evento}`, "no cuenta doble", !js.includes(`"arg1":"${PUENTE.evento}"`)],
  ...claves.map((k) => ["variable", k, js.includes(`"vtp_name":"${k}"`)]),
  ["GA4", GA4, js.includes(GA4)],
];

console.log(`\n  ${ID} publicado: versión ${version}, ${js.length} bytes`);
for (const [tipo, que, ok] of chequeos) {
  console.log(`  ${ok ? "ok   " : "FALTA"}  ${tipo.padEnd(28)} ${que}`);
}
const fallas = chequeos.filter(([, , ok]) => !ok).length;
console.log(fallas ? `\n  ${fallas} chequeo(s) fallaron\n` : "\n  Todo ok\n");
process.exit(fallas ? 1 : 0);
