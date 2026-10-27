/**
 * planes-verificar.mjs - Comprueba que el sitio muestre los valores que tiene
 * src/data/planes.js.
 *
 * POR QUÉ EXISTE
 * Que el archivo de datos esté bien no garantiza que la página lo muestre: el
 * listado y la ficha formatean los números, filtran por modelo y eligen qué
 * campos mostrar. Este es el último paso de "actualizar los planes": se pide
 * cada página como la vería un visitante y se buscan los montos ya formateados
 * ("189.420"), sin depender de si el formato pone "$ " o "$".
 *
 * USO (con el sitio corriendo, local o una preview de Vercel)
 *   node --no-warnings scripts/planes-verificar.mjs [url-base]
 *   url-base por defecto: http://localhost:3000
 */

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const { PLANES } = await import(pathToFileURL(resolve("src/data/planes.js")).href);
const miles = (n) => Math.round(n).toLocaleString("es-AR");

async function pagina(path) {
  const res = await fetch(base + path);
  return { ok: res.ok, status: res.status, html: await res.text() };
}

let fallas = 0;
const revisar = (ok, texto) => {
  if (!ok) fallas++;
  console.log(`  ${ok ? "✓" : "✗"} ${texto}`);
};

console.log(`Verificando ${base}\n\n/planes`);
const listado = await pagina("/planes");
revisar(listado.ok, `responde ${listado.status}`);
for (const p of PLANES) revisar(listado.html.includes(miles(p.cuotas_desde)), `${p.id}: cuota ${miles(p.cuotas_desde)}`);

for (const p of PLANES) {
  console.log(`\n/planes/${p.id}`);
  const ficha = await pagina(`/planes/${p.id}`);
  revisar(ficha.ok, `responde ${ficha.status}`);
  for (const k of ["cuotas_desde", "valor_movil_con_imp", "valor_movil_sin_imp"])
    if (p[k] != null) revisar(ficha.html.includes(miles(p[k])), `${k} ${miles(p[k])}`);
}

console.log(fallas ? `\n${fallas} falla(s).` : "\nTodo lo que dice planes.js se ve en el sitio.");
process.exitCode = fallas ? 1 : 0;
