/**
 * Test de consistencia del bloque de precio entre las tres fichas.
 *
 * POR QUÉ EXISTE
 * El bug del precio que se salía de la caja violeta se arregló tres veces, en
 * tres momentos distintos, porque las mismas reglas de layout están copiadas en
 * CardAuto, CardSimilar y CardDetalle. Se arreglaba una y las otras dos seguían
 * rotas sin que nadie lo notara.
 *
 * POR QUÉ NO SE UNIFICÓ EL CSS
 * Las tres comparten el layout pero NO la tipografía: el detalle usa fuente más
 * grande y la del carrusel más chica, a propósito. Extraer una hoja común
 * obligaría a que cada ficha sobrescriba lo suyo, y el riesgo de especificidad
 * es peor que el problema.
 *
 * QUÉ HACE ESTE TEST
 * Compara solo las propiedades de LAYOUT del bloque de precio y falla si alguna
 * diverge. Si alguien arregla una ficha y se olvida de las otras, salta acá en
 * vez de aparecer en producción. Las tipografías quedan libres a propósito.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const CARDS = {
  CardAuto: "src/components/vehicles/Card/CardAuto/CardAuto.module.css",
  CardSimilar: "src/components/vehicles/Card/CardSimilar/CardSimilar.module.css",
  CardDetalle: "src/components/vehicles/Detail/CardDetalle/CardDetalle.module.css",
};

/** Propiedades que definen el comportamiento del bloque, no su aspecto. */
const LAYOUT_PROPS = [
  "flex",
  "min-width",
  "white-space",
  "overflow",
  "text-overflow",
  "flex-direction",
  "flex-wrap",
];

/**
 * Quita los bloques @media / @container completos, contando llaves.
 *
 * No alcanza con cortar en el primer @media: en CardDetalle el bloque de precio
 * viene después de varias media queries y quedaba fuera del análisis.
 *
 * Se descartan a propósito: dentro de @container las tres fichas SÍ difieren de
 * forma legítima (el apilado del precio solo aplica a las angostas).
 */
function soloReglasBase(css) {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const at = css.slice(i).search(/@(?:media|container)\b/);
    if (at === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, i + at);
    // Avanzar hasta la llave que abre el at-rule y saltear su bloque completo.
    let j = i + at;
    while (j < css.length && css[j] !== "{") j++;
    let depth = 0;
    for (; j < css.length; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") {
        depth--;
        if (depth === 0) {
          j++;
          break;
        }
      }
    }
    i = j;
  }
  return out;
}

/**
 * Extrae las declaraciones de layout de una clase dentro de un CSS.
 * Recorre los bloques `selector { ... }` y se queda con los que apuntan a la
 * clase pedida, sea sola (`.price_value`) o descendiente
 * (`.priceSection .price_value`, que usa CardDetalle).
 */
function layoutDeUnaClase(css, clase) {
  const base = soloReglasBase(css);
  const declaraciones = {};
  let encontrada = false;

  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(base)) !== null) {
    const selector = m[1].trim();
    const cuerpo = m[2];

    // Debe terminar en la clase pedida, sin pseudo-elementos ni hermanos.
    const apunta = selector
      .split(",")
      .some((s) => new RegExp(`\\.${clase}\\s*$`).test(s.trim()));
    if (!apunta) continue;

    encontrada = true;
    for (const linea of cuerpo.split(";")) {
      const idx = linea.indexOf(":");
      if (idx === -1) continue;
      const nombre = linea.slice(0, idx).trim();
      if (!LAYOUT_PROPS.includes(nombre)) continue;
      declaraciones[nombre] = linea
        .slice(idx + 1)
        .trim()
        .replace(/\s+/g, " ");
    }
  }

  return encontrada ? declaraciones : null;
}

function leer(card) {
  return fs.readFileSync(path.resolve(CARDS[card]), "utf8");
}

describe("bloque de precio — layout consistente entre las 3 fichas", () => {
  const nombres = Object.keys(CARDS);

  it("las tres fichas definen las clases del bloque de precio", () => {
    for (const card of nombres) {
      const css = leer(card);
      for (const clase of ["price_label_container", "price_display", "price_value", "price_original"]) {
        expect(css, `${card} debería definir .${clase}`).toContain(`.${clase}`);
      }
    }
  });

  it.each([
    ["price_label_container", "el label cede espacio al precio"],
    ["price_display", "el bloque del precio toma el ancho sobrante"],
    ["price_original", "el tachado cede primero, con recorte"],
    ["price_value", "el precio final nunca se recorta ni se parte"],
  ])("`.%s` tiene el mismo layout en las 3 fichas (%s)", (clase) => {
    const porCard = {};
    for (const card of nombres) {
      porCard[card] = layoutDeUnaClase(leer(card), clase);
    }

    const referencia = porCard[nombres[0]];
    expect(referencia, `no se encontró .${clase} en ${nombres[0]}`).not.toBeNull();

    for (const card of nombres.slice(1)) {
      expect(
        porCard[card],
        `.${clase} en ${card} difiere de ${nombres[0]}. ` +
          `Si se arregló una ficha, hay que arreglar las tres.`,
      ).toEqual(referencia);
    }
  });

  it("ninguna ficha vuelve al reparto de ancho fijo que causaba el desborde", () => {
    // El bug original: 30% + 70% + gap + padding sumaban más del 100%.
    for (const card of nombres) {
      const css = leer(card);
      expect(css, `${card} no debe usar --label-width`).not.toMatch(/--label-width/);
      expect(css, `${card} no debe usar --price-width`).not.toMatch(/--price-width/);
    }
  });
});
