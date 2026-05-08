"use client";

import { useEffect, useRef } from "react";
import { pushEcommerceEvent } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Dispara `view_item` al montar.
 * Pensado para insertarse dentro de páginas detalle (Server Components).
 * Usa pushEcommerceEvent: incluye reset { ecommerce: null } y wrapper ecommerce.items[].
 * Los campos del item también se replican al root del evento para custom dimensions simples.
 *
 * @param {object} props
 * @param {object} props.item - resultado de buildItemParamsFrom* (puede ser null si la data aún no está)
 * @param {string} props.location - LOCATIONS.*
 * @param {string} [props.source] - SOURCES.* — nunca pasar strings crudos fuera del enum
 * @param {string} [props.componentId] - identificador estable del componente (ej: "detail_page")
 */
export default function ItemViewTracker({ item, location, source, componentId }) {
  const sentRef = useRef(false);
  useEffect(() => {
    if (sentRef.current) return;
    if (!item || !item.item_id) return;
    sentRef.current = true;
    pushEcommerceEvent(EVENTS.VIEW_ITEM, {
      location,
      ...(source ? { source } : {}),
      ...(componentId ? { component_id: componentId } : {}),
      // item_id, item_name, item_category al root para custom dimensions simples
      item_id: item.item_id,
      item_name: item.item_name,
      item_category: item.item_category,
      items: [item],
    });
  }, [item, location, source, componentId]);
  return null;
}
