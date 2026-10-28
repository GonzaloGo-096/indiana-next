/**
 * Escribe docs/analytics/gtm-medicion-simple.json desde la definición de
 * scripts/gtm-definition.mjs, para importarlo en GTM (Administrador →
 * Importar contenedor → espacio de trabajo "medicion-simple" → Sobrescribir).
 *
 *   node scripts/gtm-container.mjs
 *
 * La fecha de exportación es fija para que regenerar sin cambios no ensucie el
 * diff; el test de correspondencia comprueba que el archivo esté al día.
 */
import fs from "node:fs";
import { buildContainer } from "./gtm-definition.mjs";

const out = buildContainer();
fs.writeFileSync("docs/analytics/gtm-medicion-simple.json", JSON.stringify(out, null, 2) + "\n");
const v = out.containerVersion;
console.log(`etiquetas ${v.tag.length} · activadores ${v.trigger.length} · variables ${v.variable.length}`);
