"use client";

import { useEffect, useRef } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Dispara `view_item` al montar.
 * Pensado para insertarse dentro de páginas detalle (Server Components).
 *
 * @param {object} props
 * @param {object} props.item - resultado de buildItemParamsFrom* (puede ser null si la data aún no está)
 * @param {string} props.location - LOCATIONS.*
 */
export default function ItemViewTracker({ item, location }) {
  const sentRef = useRef(false);
  useEffect(() => {
    if (sentRef.current) return;
    if (!item || !item.item_id) return;
    sentRef.current = true;
    pushDataLayer(EVENTS.VIEW_ITEM, { ...item, location });
  }, [item, location]);
  return null;
}
