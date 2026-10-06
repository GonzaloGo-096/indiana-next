"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import { setPageItem } from "@/lib/analytics/pageItem";

/**
 * Registra `view_item` una vez al abrir una ficha (0km, usado o plan) y deja
 * anotado el auto para el WhatsApp flotante (pageItem.js).
 * Va dentro de páginas de servidor, por eso es un componente aparte.
 *
 * @param {{ item: { item_id: string, item_name: string, item_category: string } | null }} props
 */
export default function ItemViewTracker({ item }) {
  const sent = useRef(false);
  useEffect(() => {
    setPageItem(item);
    if (sent.current || !item?.item_id) return;
    sent.current = true;
    track(EVENTS.VIEW_ITEM, item);
  }, [item]);
  return null;
}
