"use client";

/**
 * Hook de tracking para carruseles: dispara `carousel_interact` al dataLayer.
 *
 * Cumple la spec del README de analytics (sección "Pendiente (TODO)"):
 * - Params: { component_id, action: "next"|"prev"|"dot", slide_index?, total_slides, location, source: "carousel" }
 * - Debounce trailing de 250ms: bursts de clicks/navegación colapsan en un solo
 *   evento (gana el último payload). Evita inflar GA4 con micro-interacciones.
 *
 * `location` es opcional: si el padre no lo inyecta, se deriva del pathname
 * (mismo criterio que FloatingWhatsAppButton).
 *
 * Uso:
 *   const trackInteract = useCarouselInteract({
 *     componentId: "carousel-0km-vehiculos",
 *     totalSlides: cards.length,
 *   });
 *   trackInteract("next");                      // flecha derecha
 *   trackInteract("dot", { slideIndex: 3 });    // dot directo
 */

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS, SOURCES } from "@/lib/analytics/events";
import { locationFromPathname } from "@/lib/analytics/locationFromPath";

const DEBOUNCE_MS = 250;

export function useCarouselInteract({ componentId, location, totalSlides } = {}) {
  const pathname = usePathname();
  const timerRef = useRef(null);
  const pendingRef = useRef(null);

  // Evita disparos tardíos si el componente se desmonta mid-debounce.
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  return useCallback(
    (action, { slideIndex, totalSlides: totalOverride } = {}) => {
      if (!componentId || !action) return;
      const total = typeof totalOverride === "number" ? totalOverride : totalSlides;
      pendingRef.current = {
        source: SOURCES.CAROUSEL,
        location: location || locationFromPathname(pathname),
        component_id: componentId,
        action,
        ...(typeof slideIndex === "number" ? { slide_index: slideIndex } : {}),
        ...(typeof total === "number" ? { total_slides: total } : {}),
      };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!pendingRef.current) return;
        pushDataLayer(EVENTS.CAROUSEL_INTERACT, pendingRef.current);
        pendingRef.current = null;
      }, DEBOUNCE_MS);
    },
    [componentId, location, totalSlides, pathname],
  );
}
