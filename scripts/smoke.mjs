/**
 * smoke.mjs - Comprueba que ninguna página del sitio se caiga.
 *
 * POR QUÉ EXISTE
 * `next build` ya falla si una página estática revienta al generarse, pero no
 * dice nada de las rutas dinámicas ni de lo que pasa al pedirlas de verdad. Y
 * durante la reestructuración "el build pasó" no alcanza: la sección de usados
 * del inicio llegó a quedar vacía con el build en verde.
 *
 * CÓMO DETECTA UNA PÁGINA ROTA
 * Esto se midió, no se supuso. Una página que revienta al renderizar:
 *   - responde 200, no 500
 *   - puede pesar MÁS que la sana (35 KB contra 25 KB, medido)
 * Así que ni el código de estado ni el peso sirven. Las dos señales que sí:
 *
 *   1. `digest`: Next lo inyecta en el HTML cuando un componente lanza un error.
 *      Medido: 0 en las 13 páginas sanas, 1 en las dos rotas a propósito.
 *   2. El título: si la página no llega a ejecutarse, cae el título genérico
 *      del layout en vez del suyo. Medido en /postventa.
 *
 * La primera versión de este archivo solo miraba estado y peso, y dio verde con
 * una página deliberadamente rota. Por eso las redes se prueban rompiendo algo.
 *
 * LAS RUTAS SE DESCUBREN SOLAS
 * Se leen los `page.jsx` de src/app, así una página nueva queda cubierta sin
 * tocar este archivo. Las rutas con parámetro se resuelven siguiendo un enlace
 * real de la página que las lista; si no aparece ninguno, se avisa y se cuenta
 * como salteada, nunca como éxito.
 *
 * USO
 *   node scripts/smoke.mjs                       contra http://localhost:3000
 *   node scripts/smoke.mjs https://una-copia.app
 *   node scripts/smoke.mjs --update              regraba los títulos de referencia
 *
 * Sale con código 1 si algo falla o queda sin verificar.
 */

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const ACTUALIZAR = args.includes("--update");
const BASE = (args.find((a) => a.startsWith("http")) || process.env.SMOKE_URL || "http://localhost:3000")
  .replace(/\/$/, "");

const TIMEOUT_MS = 45000;
const MIN_BYTES = 1500;
const REFERENCIA = "scripts/smoke-baseline.json";

/**
 * Título del layout raíz. Una página que lo muestra es una que no llegó a
 * poner el suyo: o revienta, o no declara metadata.
 */
const TITULO_GENERICO = "Peugeot Indiana – Concesionaria Oficial en Tucumán | 0km y Usados";

/** Rutas que no son páginas navegables. */
const EXCLUIDAS = new Set(["/mantenimiento"]);

/**
 * El panel admin no declara título propio: sus páginas muestran el genérico
 * incluso sanas. Para ellas la única señal válida es `digest`.
 * (Que no tengan título es en sí un pendiente, anotado en la auditoría.)
 */
const SIN_TITULO_PROPIO = (ruta) => ruta === "/admin" || ruta.startsWith("/admin/");

/** Dónde buscar un enlace real para cada ruta con parámetro. */
const ORIGEN_DE_ENLACES = {
  "/usados/[slug]": { desde: "/usados/vehiculos", prefijo: "/usados" },
  "/0km/[autoSlug]": { desde: "/0km", prefijo: "/0km" },
  "/planes/[planId]": { desde: "/planes", prefijo: "/planes" },
};

function descubrirRutas(dir = "src/app", prefijo = "") {
  const rutas = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "api") continue;
      const esGrupo = entrada.name.startsWith("(") && entrada.name.endsWith(")");
      rutas.push(...descubrirRutas(completo, esGrupo ? prefijo : `${prefijo}/${entrada.name}`));
    } else if (/^page\.(jsx?|tsx?)$/.test(entrada.name)) {
      rutas.push(prefijo || "/");
    }
  }
  return rutas;
}

function titulo(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

async function pedir(ruta) {
  const inicio = Date.now();
  try {
    const r = await fetch(`${BASE}${ruta}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "smoke-indiana" },
    });
    const html = r.status === 200 ? await r.text() : "";
    return { ruta, status: r.status, bytes: html.length, ms: Date.now() - inicio, html };
  } catch (e) {
    return { ruta, status: 0, bytes: 0, ms: Date.now() - inicio, error: e.message, html: "" };
  }
}

function primerEnlace(html, prefijoRuta) {
  const re = new RegExp(`href="(${prefijoRuta}/[^"/?#]+)"`, "g");
  for (const m of html.matchAll(re)) {
    if (/\/vehiculos$/.test(m[1])) continue; // el listado no es una ficha
    return m[1];
  }
  return null;
}

/** @returns {string[]} motivos por los que la ruta se considera rota */
function revisar(r, esperado, esDinamica) {
  const motivos = [];

  if (r.error) return [r.error];
  if (r.status !== 200) return [`respondió ${r.status}`];
  if (r.bytes < MIN_BYTES) motivos.push(`solo ${r.bytes} bytes`);

  // Señal 1: rastro de error de renderizado.
  if (/\bdigest\b/.test(r.html)) motivos.push("hay un error de renderizado en el HTML");

  // Señal 2: el título.
  const t = titulo(r.html);
  if (!SIN_TITULO_PROPIO(r.ruta)) {
    if (t === TITULO_GENERICO) {
      motivos.push("muestra el título genérico: la página no llegó a renderizar");
    } else if (esDinamica) {
      if (!t) motivos.push("sin título");
    } else if (esperado && t !== esperado) {
      motivos.push(`el título cambió\n              antes: ${esperado}\n              ahora: ${t}`);
    } else if (!esperado) {
      motivos.push("sin título de referencia (correr con --update)");
    }
  }

  return motivos;
}

// ── Corrida ──────────────────────────────────────────────────────────────────

const todas = descubrirRutas();
const estaticas = todas.filter((r) => !r.includes("[")).filter((r) => !EXCLUIDAS.has(r)).sort();
const dinamicas = todas.filter((r) => r.includes("["));

const referencia = fs.existsSync(REFERENCIA)
  ? JSON.parse(fs.readFileSync(REFERENCIA, "utf8"))
  : {};

console.log(`\n  Smoke contra ${BASE}`);
console.log(`  ${estaticas.length} rutas fijas + ${dinamicas.length} con parámetro${ACTUALIZAR ? "   [regrabando referencia]" : ""}\n`);

const filas = [];
const htmlPorRuta = new Map();
const nuevaReferencia = {};

for (const ruta of estaticas) {
  const r = await pedir(ruta);
  htmlPorRuta.set(ruta, r.html);
  if (r.status === 200) nuevaReferencia[ruta] = titulo(r.html);
  filas.push({ r, motivos: ACTUALIZAR ? [] : revisar(r, referencia[ruta], false) });
}

const salteadas = [];
for (const plantilla of dinamicas) {
  const origen = ORIGEN_DE_ENLACES[plantilla];
  if (!origen) {
    salteadas.push({ plantilla, motivo: "no está mapeada en ORIGEN_DE_ENLACES" });
    continue;
  }
  const concreta = primerEnlace(htmlPorRuta.get(origen.desde) || "", origen.prefijo);
  if (!concreta) {
    salteadas.push({ plantilla, motivo: `ningún enlace encontrado en ${origen.desde}` });
    continue;
  }
  const r = await pedir(concreta);
  filas.push({ r, plantilla, motivos: ACTUALIZAR ? [] : revisar(r, null, true) });
}

if (ACTUALIZAR) {
  fs.writeFileSync(REFERENCIA, JSON.stringify(nuevaReferencia, null, 2) + "\n");
  console.log(`  Referencia grabada: ${Object.keys(nuevaReferencia).length} títulos en ${REFERENCIA}\n`);
  process.exit(0);
}

let fallos = 0;
for (const { r, motivos } of filas) {
  const ok = motivos.length === 0;
  if (!ok) fallos++;
  const marca = ok ? "ok   " : "FALLA";
  console.log(
    `  ${marca}  ${r.ruta.padEnd(44)} ${String(r.status).padEnd(4)} ${String(r.bytes).padStart(7)} b  ${String(r.ms).padStart(5)} ms`,
  );
  for (const m of motivos) console.log(`            -> ${m}`);
}

for (const s of salteadas) {
  console.log(`  SALTA  ${s.plantilla.padEnd(44)} ${s.motivo}`);
}

console.log("");
if (salteadas.length > 0) {
  console.log(`  ${salteadas.length} ruta(s) con parámetro sin verificar: no cuentan como éxito.`);
}
console.log(`  ${filas.length - fallos}/${filas.length} rutas bien\n`);

process.exit(fallos > 0 || salteadas.length > 0 ? 1 : 0);
