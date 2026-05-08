"use client";

import { useEffect, useRef } from "react";
import { pushEcommerceEvent } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Dispara `view_item_list` cuando cambia la lista visible (no por scroll).
 * Usa pushEcommerceEvent: incluye reset { ecommerce: null } y wrapper ecommerce.items[].
 *
 * @param {object} props
 * @param {object[]} props.items - array de items ya construidos con buildItemParamsFrom*
 * @param {string} props.itemListName - ITEM_LIST.*
 * @param {string} props.location - LOCATIONS.*
 * @param {string} [props.source] - SOURCES.* (ej: SOURCES.LISTING_PAGE)
 * @param {string} [props.signature] - clave para detectar cambios (filtros aplicados, etc.).
 *   Si no se pasa, se usan los IDs concatenados de los primeros 10 items.
 */
export default function ItemListViewTracker({
  items,
  itemListName,
  location,
  source,
  signature,
}) {
  const lastSigRef = useRef("");
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;
    const sig =
      signature ||
      `${itemListName}|${items
        .slice(0, 10)
        .map((i) => i?.item_id)
        .filter(Boolean)
        .join(",")}`;
    if (lastSigRef.current === sig) return;
    lastSigRef.current = sig;
    pushEcommerceEvent(EVENTS.VIEW_ITEM_LIST, {
      location: location || "",
      ...(source ? { source } : {}),
      itemListName: itemListName || "",
      items: items
        .filter(Boolean)
        .slice(0, 10)
        .map((it, index) => ({
          ...it,
          item_list_name: it.item_list_name || itemListName,
          index,
        })),
    });
  }, [items, itemListName, location, source, signature]);
  return null;
}
