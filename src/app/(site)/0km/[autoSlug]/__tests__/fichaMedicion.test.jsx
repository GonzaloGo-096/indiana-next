/**
 * La ficha 0km tiene que montar su ItemViewTracker con el auto: sin él no
 * sale view_item, el flotante pierde el auto y la visita de la ficha recién
 * se cuenta a los FICHA_MAX_MS (8 s), así que quien se va antes no cuenta.
 *
 * La página es de servidor: se arma el árbol y se lo recorre, sin renderizar.
 */
import { describe, it, expect } from "vitest";
import { isValidElement } from "react";
import ItemViewTracker from "@/components/analytics/ItemViewTracker";
import WhatsAppLink from "@/components/analytics/WhatsAppLink";
import { getModelosSlugs } from "@/data/modelos";
import Page from "../page";

/** Todos los elementos del árbol, también los pasados por props (contactCta). */
function elementos(nodo, out = []) {
  if (Array.isArray(nodo)) {
    nodo.forEach((n) => elementos(n, out));
  } else if (isValidElement(nodo)) {
    out.push(nodo);
    for (const v of Object.values(nodo.props || {})) elementos(v, out);
  }
  return out;
}

const slug = getModelosSlugs()[0];

describe(`ficha 0km (${slug})`, () => {
  it("monta ItemViewTracker con el auto de la ficha", async () => {
    const arbol = await Page({ params: Promise.resolve({ autoSlug: slug }) });
    const trackers = elementos(arbol).filter((e) => e.type === ItemViewTracker);
    expect(trackers).toHaveLength(1);
    expect(trackers[0].props.item?.item_id).toBeTruthy();
  });

  it("el WhatsApp de la ficha manda el mismo auto y su component_id de siempre", async () => {
    const arbol = await Page({ params: Promise.resolve({ autoSlug: slug }) });
    const todos = elementos(arbol);
    const visto = todos.find((e) => e.type === ItemViewTracker).props.item;
    const wa = todos.find((e) => e.type === WhatsAppLink);
    expect(wa.props.componentId).toBe("whatsapp-detalle-0km");
    expect(wa.props.item).toEqual(visto);
  });
});
