/**
 * planes-oficiales.mjs - Trae los planes vigentes de Peugeot Plan y los compara
 * con los que publica el sitio (src/data/planes.js).
 *
 * DE DÓNDE SALE LA INFORMACIÓN
 * peugeotindiana.com.ar republica a mano los planes de la administradora
 * (Círculo de Inversores, www.peugeotplan.com.ar). Ese sitio está detrás de
 * Cloudflare y bloquea tanto a curl como al Chrome de Gonzalo (medido el
 * 2026-10-06), así que se lee directo la fuente: la API pública que usa
 * peugeotplan.com.ar para dibujar sus propias páginas. No pide login.
 *
 *   GET /pageValue/getAllFor/peugeot/car_models/0   -> lista de planes vigentes
 *   GET /pageValue/getCarModelWithoutFiles/{id}     -> detalle + cuadro de cuotas
 *
 * Hay que mandar `Accept: application/json`; sin eso responde XML.
 *
 * QUÉ SE CALCULA Y QUÉ SE LEE
 * El texto descriptivo de cada plan lo cargan a mano en un editor y cambia de
 * formato de un plan a otro ("CUOTA 2 - 20%", "Cuota 2: 20%", a veces sin el
 * porcentaje de recupero). Por eso los porcentajes de diferimiento y recupero
 * se calculan del cuadro de cuotas (monto / alícuota), que es numérico y
 * parejo. Del texto solo se toma lo que no está en el cuadro: tipo de plan,
 * adjudicación pactada, licitación mínima, meses de derecho de inscripción y
 * sellado. Si algo no se pudo leer queda en null y se avisa, nunca se inventa.
 *
 * USO
 *   node scripts/planes-oficiales.mjs                 lista + comparación
 *   node scripts/planes-oficiales.mjs --json out.json además guarda el JSON
 *
 * La comparación vincula cada plan del sitio con el oficial por `id_oficial`
 * (el id del modelo en peugeotplan). Sale con código 1 si hay diferencias,
 * para poder usarlo en un chequeo programado.
 */

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const BASE = "https://www.peugeotplan.com.ar";

// Pedidos en paralelo le sacan 502 al servidor (medido): van de a uno y con
// reintento.
async function getJson(path, intentos = 3) {
  const res = await fetch(BASE + path, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  if (res.ok) return res.json();
  if (intentos > 1 && res.status >= 500) {
    await new Promise((r) => setTimeout(r, 2000));
    return getJson(path, intentos - 1);
  }
  throw new Error(`${path} respondió ${res.status}`);
}

// "$41.670.000" -> 41670000
const pesos = (txt) => {
  const m = txt?.match(/\$\s*([\d.]+(?:,\d+)?)/);
  return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null;
};

const decodeHtml = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/p>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/&([aeiou])acute;/gi, (_, v) => ({ a: "á", e: "é", i: "í", o: "ó", u: "ú" })[v.toLowerCase()] ?? v)
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&amp;/g, "&");

const lineas = (html) =>
  decodeHtml(html ?? "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && l !== "-");

/** Lee del texto lo que el cuadro de cuotas no tiene. */
function parsearDetalle(html) {
  const ls = lineas(html);
  const texto = ls.join("\n");
  const num = (re) => {
    const m = texto.match(re);
    return m ? Number(m[1]) : null;
  };

  const tipo = texto.match(/Plan\s+(\d+\s*\/\s*\d+|100\s*%)/i)?.[1].replace(/\s/g, "") ?? null;

  const adjLinea = texto.match(/Adjudicaci[oó]n Pactada en Cuotas?\s*([\d,\sy]+)/i)?.[1];
  const adjudicacion = adjLinea ? adjLinea.match(/\d+/g).map(Number) : null;

  // Licitación mínima: líneas "Cuota 4: 30%", "CUOTA 2 - 20%" o
  // "Cuotas 2, 6, 9 y 12: 20%". Se leen las líneas que siguen al título.
  const licitacion = {};
  const iLic = ls.findIndex((l) => /Licitaci[oó]n m[ií]nima/i.test(l));
  if (iLic >= 0) {
    for (const l of ls.slice(iLic + 1)) {
      const m = l.match(/^CUOTAS?\s+([\d,\sy]+?)\s*[:-]\s*(\d+(?:[.,]\d+)?)\s*%/i);
      if (!m) break;
      for (const c of m[1].match(/\d+/g)) licitacion[c] = `${m[2].replace(",", ".")}%`;
    }
  }

  // El diferimiento se toma del cuadro; el del texto se lee solo para avisar
  // si los dos no coinciden (pasó con Plus AT: el texto dice 13 a 18 y el
  // cuadro lo aplica solo en la 13).
  const iDif = ls.findIndex((l) => /Diferimiento Comercial/i.test(l) && !/Recupero/i.test(l));
  const iRec = ls.findIndex((l) => /Recupero/i.test(l));
  const tramoDif = iDif >= 0 ? ls.slice(iDif, iRec > iDif ? iRec : undefined).join(" ") : "";
  const diferimientoTexto = Object.fromEntries(
    [...tramoDif.matchAll(/CUOTAS?\s+(\d+)\s+A\s+(\d+)\s*[:-]\s*(\d+(?:[.,]\d+)?)\s*%/gi)].map((m) => [
      `cuotas_${m[1]}_${m[2]}`,
      `${m[3].replace(",", ".")}%`,
    ]),
  );

  const extras = ls.filter((l) => /bonificaci|descuento/i.test(l)).map((l) => l.replace(/^-\s*/, ""));

  return {
    texto,
    cuotas_totales: num(/(\d+)\s*cuotas/i),
    tipo_plan: tipo,
    adjudicacion_pactada: adjudicacion,
    licitacion_minima: Object.keys(licitacion).length ? licitacion : null,
    derecho_inscripcion_prorrateado: num(/Derecho de Inscripci[oó]n Prorrateado en\s*(\d+)/i),
    sellado_prorrateado: num(/Sellado Prorrateado en\s*(\d+)/i),
    diferimientoTexto: Object.keys(diferimientoTexto).length ? diferimientoTexto : null,
    recuperoTexto: texto.match(/(\d+(?:[.,]\d+)?)\s*%\s*DE LA AL[IÍ]CUOTA/i)?.[1].replace(",", ".") ?? null,
    extras,
  };
}

/**
 * Del cuadro de cuotas: tramos ("2 a 12") y montos por concepto. Los
 * porcentajes salen de dividir por la alícuota, y los tramos contiguos con el
 * mismo porcentaje se juntan ("1", "2 a 12" -> cuotas_1_12).
 */
function parsearCuadro(json) {
  if (!json) return null;
  const filas = JSON.parse(json).map((r) => r.map((c) => String(c.value ?? "").trim()));
  const tramos = filas[0].slice(1).map((t) => {
    // A veces viene "1.00" en vez de "1".
    const n = t.match(/\d+(?:\.\d+)?/g).map((x) => Math.round(Number(x)));
    return [n[0], n[n.length - 1]];
  });
  const fila = (re) => filas.find((r) => re.test(r[0]))?.slice(1).map((v) => (v === "" ? 0 : Number(v)));
  const alicuota = fila(/^Al[ií]cuota/i);
  const total = fila(/^TOTAL/i);

  const porcentajes = (valores) => {
    if (!valores || !alicuota) return null;
    const out = {};
    let actual = null;
    tramos.forEach(([desde, hasta], i) => {
      // En dos pasos para que 6,25% dé 6.3%, como publica Peugeot, y no 6.2%
      // por el error de coma flotante.
      const pct = Math.round(Math.round((Math.abs(valores[i]) / alicuota[i]) * 10000) / 10 + 1e-9) / 10;
      if (!pct) return (actual = null);
      if (actual && actual.pct === pct && actual.hasta + 1 === desde) actual.hasta = hasta;
      else out[(actual = { desde, hasta, pct }).desde] = actual;
    });
    return Object.fromEntries(Object.values(out).map((t) => [`cuotas_${t.desde}_${t.hasta}`, `${t.pct}%`]));
  };

  return {
    tramos: tramos.map(([d, h], i) => ({ cuotas: d === h ? `${d}` : `${d} a ${h}`, total: total?.[i] ?? null })),
    filas,
    diferimiento_comercial: porcentajes(fila(/^Diferimiento/i)),
    recupero_diferimiento: porcentajes(fila(/^Recupero/i)),
    ultima_cuota: tramos.at(-1)?.[1] ?? null,
  };
}

async function traerPlanesOficiales() {
  const lista = await getJson("/pageValue/getAllFor/peugeot/car_models/0");
  const modelos = lista.items.carModels.filter((m) => m.enabled);

  const planes = [];
  for (const m of modelos) planes.push(await armarPlan(m));
  return planes;
}

async function armarPlan(m) {
  const detalle = await getJson(`/pageValue/getCarModelWithoutFiles/${m.id}`);
  const pd = detalle.savingPlans[0]?.planDetails ?? {};
  const txt = parsearDetalle(pd.details);
  const cuadro = parsearCuadro(pd.feesTableValuesJson);
  const [modelo] = m.modelName.split(/\s+-\s+Valor/i);

  const avisos = [];
  for (const k of ["tipo_plan", "adjudicacion_pactada", "licitacion_minima", "derecho_inscripcion_prorrateado", "sellado_prorrateado"])
    if (txt[k] == null) avisos.push(`no se pudo leer ${k} del texto`);
  if (!cuadro) avisos.push("el plan no tiene cuadro de cuotas");
  if (txt.cuotas_totales && cuadro && txt.cuotas_totales !== cuadro.ultima_cuota)
    avisos.push(`el texto dice ${txt.cuotas_totales} cuotas y el cuadro llega a ${cuadro.ultima_cuota}`);
  if (txt.diferimientoTexto && cuadro?.diferimiento_comercial &&
      JSON.stringify(txt.diferimientoTexto) !== JSON.stringify(cuadro.diferimiento_comercial))
    avisos.push(`diferimiento: el texto dice ${JSON.stringify(txt.diferimientoTexto)} y el cuadro ${JSON.stringify(cuadro.diferimiento_comercial)} (se usa el cuadro)`);
  const recCuadro = Object.values(cuadro?.recupero_diferimiento ?? {});
  if (txt.recuperoTexto && recCuadro.length && recCuadro.some((v) => v !== `${txt.recuperoTexto}%`))
    avisos.push(`recupero: el texto dice ${txt.recuperoTexto}% y el cuadro ${recCuadro.join(", ")} (se usa el cuadro)`);
  const sinImp = pesos(m.modelName.split(/sin imp/i)[1]);
  if (!sinImp) avisos.push("la página oficial no publica el valor sin impuestos");

  return {
    id_oficial: m.id,
    plan: pd.name || m.detailsName,
    boton: m.buttonName.trim(),
    modelo: modelo.trim(),
    cuotas_desde: pesos(m.feeStartingAt),
    valor_movil_con_imp: pesos(m.modelName.split(/sin imp/i)[0]),
    valor_movil_sin_imp: sinImp,
    caracteristicas: {
      cuotas_totales: txt.cuotas_totales ?? cuadro?.ultima_cuota ?? null,
      tipo_plan: txt.tipo_plan,
      adjudicacion_pactada: txt.adjudicacion_pactada,
      licitacion_minima: txt.licitacion_minima,
      derecho_inscripcion_prorrateado: txt.derecho_inscripcion_prorrateado,
      sellado_prorrateado: txt.sellado_prorrateado,
      diferimiento_comercial: cuadro?.diferimiento_comercial ?? null,
      recupero_diferimiento: cuadro?.recupero_diferimiento ?? null,
    },
    extras: txt.extras,
    cuadro_cuotas: cuadro?.tramos ?? [],
    url: `${BASE}/plan/${m.id}`,
    avisos,
  };
}

const fmt = (n) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("es-AR"));
const pctTxt = (o) => (o ? Object.entries(o).map(([k, v]) => `${k.replace("cuotas_", "").replace("_", "-")}: ${v}`).join(", ") : "—");

function imprimir(planes) {
  console.log(`\nPLANES VIGENTES EN PEUGEOT PLAN (${planes.length}) - ${new Date().toLocaleString("es-AR")}\n`);
  for (const p of planes) {
    const c = p.caracteristicas;
    console.log(`■ ${p.plan}  [id_oficial ${p.id_oficial}]`);
    console.log(`  Modelo:            ${p.modelo}`);
    console.log(`  Cuota desde:       ${fmt(p.cuotas_desde)}`);
    console.log(`  Valor móvil:       ${fmt(p.valor_movil_con_imp)} con imp. / ${fmt(p.valor_movil_sin_imp)} sin imp.`);
    console.log(`  Plan:              ${c.cuotas_totales} cuotas, ${c.tipo_plan}`);
    console.log(`  Adj. pactada:      cuotas ${c.adjudicacion_pactada?.join(", ") ?? "—"}`);
    console.log(`  Licitación mínima: ${c.licitacion_minima ? Object.entries(c.licitacion_minima).map(([k, v]) => `cuota ${k}: ${v}`).join(", ") : "—"}`);
    console.log(`  Der. inscripción:  prorrateado en ${c.derecho_inscripcion_prorrateado ?? "—"} meses`);
    console.log(`  Sellado:           prorrateado en ${c.sellado_prorrateado ?? "—"} meses`);
    console.log(`  Diferimiento:      ${pctTxt(c.diferimiento_comercial)}`);
    console.log(`  Recupero:          ${pctTxt(c.recupero_diferimiento)} de la alícuota`);
    if (p.extras.length) console.log(`  Extras:            ${p.extras.join(" / ")}`);
    console.log(`  Cuotas:            ${p.cuadro_cuotas.map((t) => `${t.cuotas}: ${fmt(t.total)}`).join(" | ")}`);
    for (const a of p.avisos) console.log(`  ⚠ ${a}`);
    console.log("");
  }
}

/** Compara contra src/data/planes.js. Devuelve la cantidad de diferencias. */
async function comparar(oficiales) {
  const ruta = pathToFileURL(resolve("src/data/planes.js")).href;
  const { PLANES } = await import(ruta);
  let difs = 0;
  const vinculados = new Set();
  console.log("COMPARACIÓN CON src/data/planes.js\n");

  for (const local of PLANES) {
    const of = oficiales.find((o) => o.id_oficial === local.id_oficial);
    if (!of) {
      difs++;
      console.log(`✗ ${local.id}: ${local.id_oficial ? `id_oficial ${local.id_oficial} ya no está vigente` : "sin id_oficial, no se puede vincular"}`);
      continue;
    }
    vinculados.add(of.id_oficial);
    const cambios = [];
    for (const k of ["cuotas_desde", "valor_movil_con_imp", "valor_movil_sin_imp"])
      if (of[k] != null && local[k] !== of[k]) cambios.push(`${k}: ${local[k]} -> ${of[k]}`);
    for (const [k, v] of Object.entries(of.caracteristicas))
      if (v != null && JSON.stringify(local.caracteristicas?.[k]) !== JSON.stringify(v))
        cambios.push(`${k}: ${JSON.stringify(local.caracteristicas?.[k])} -> ${JSON.stringify(v)}`);
    difs += cambios.length;
    console.log(`${cambios.length ? "✗" : "✓"} ${local.id} <- ${of.plan}`);
    for (const c of cambios) console.log(`    ${c}`);
  }
  for (const o of oficiales.filter((o) => !vinculados.has(o.id_oficial))) {
    difs++;
    console.log(`+ NUEVO en Peugeot Plan, no está en el sitio: ${o.plan} (${o.modelo}) [id_oficial ${o.id_oficial}]`);
  }
  console.log(difs ? `\n${difs} diferencia(s).` : "\nEl sitio está al día.");
  return difs;
}

const planes = await traerPlanesOficiales();
imprimir(planes);
const iJson = process.argv.indexOf("--json");
if (iJson > 0) {
  writeFileSync(process.argv[iJson + 1], JSON.stringify({ obtenido: new Date().toISOString(), fuente: BASE, planes }, null, 2));
  console.log(`JSON guardado en ${process.argv[iJson + 1]}\n`);
}
const difs = await comparar(planes);
process.exitCode = difs ? 1 : 0;
