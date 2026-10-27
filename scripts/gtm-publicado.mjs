/**
 * gtm-publicado.mjs - Compara el contenedor PUBLICADO en GTM con el contrato.
 *
 * El test de contrato compara el código con scripts/gtm-definition.mjs, y el
 * JSON para importar con esa misma definición. Nada comprobaba lo que de
 * verdad está publicado en GTM. gtm.js es público y trae, como texto, los
 * nombres de evento de los activadores, las claves de dataLayer que leen las
 * variables y el ID de GA4: alcanza para detectar un contenedor viejo, una
 * publicación a medias o una variable borrada a mano.
 *
 * Limitación: mira presencia de textos, no la configuración completa (por
 * ejemplo no distingue a qué etiqueta va cada parámetro).
 *
 *   node scripts/gtm-publicado.mjs            contra GTM-TPJCFTBB
 *   node scripts/gtm-publicado.mjs GTM-XXXX
 *
 * Sale con código 1 si falta algo.
 */
import { CONTRATO, PUENTE, MARCA_PRUEBA, GA4 } from "./gtm-definition.mjs";

const ID = process.argv[2] || "GTM-TPJCFTBB";
const r = await fetch(`https://www.googletagmanager.com/gtm.js?id=${ID}`, {
  signal: AbortSignal.timeout(20000),
});
if (!r.ok) {
  console.error(`  gtm.js respondió ${r.status}`);
  process.exit(1);
}
const js = await r.text();
const version = js.match(/"version":"(\d+)"/)?.[1] ?? "?";

const esperados = [
  ...Object.keys(CONTRATO).map((ev) => ["evento", ev]),
  ...[...new Set([...Object.values(CONTRATO).flat(), ...PUENTE.parametros])].map((p) => ["parámetro", p]),
  ["evento del puente", PUENTE.evento],
  ["marca de prueba", MARCA_PRUEBA],
  ["GA4", GA4],
];

const faltan = esperados.filter(([, texto]) => !js.includes(texto));
console.log(`\n  ${ID} publicado: versión ${version}, ${js.length} bytes`);
for (const [tipo, texto] of esperados) {
  console.log(`  ${faltan.some(([, t]) => t === texto) ? "FALTA" : "ok   "}  ${tipo.padEnd(18)} ${texto}`);
}
console.log("");
process.exit(faltan.length ? 1 : 0);
