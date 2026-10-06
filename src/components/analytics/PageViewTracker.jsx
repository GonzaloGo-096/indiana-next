"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Registra `page_view` al entrar y en cada cambio de página.
 *
 * Por qué desde el código: al navegar sin recargar (Next) la etiqueta de
 * Google no registraba la visita; se midió el 2026-10-06 en producción, solo
 * contaba la primera página de cada sesión. Por eso en GTM la etiqueta de
 * Google tiene el page_view automático APAGADO: si se prende, la primera
 * visita se cuenta doble.
 *
 * Solo mira la ruta, no la query: aplicar filtros en usados no es otra visita.
 *
 * Espera a que la ruta se asiente: las fichas de usados redirigen a su URL
 * canónica apenas cargan (las cards del listado linkean sin la versión) y,
 * sin la espera, una visita contaba como dos. De paso toma el título nuevo.
 * Costo aceptado: el view_item de la ficha llega a GA4 antes que su page_view,
 * y quien se va en menos de medio segundo no cuenta como visita.
 */
export const SETTLE_MS = 500;

export default function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef(null);
  useEffect(() => {
    if (!pathname || last.current === pathname) return undefined;
    const t = setTimeout(() => {
      last.current = pathname;
      track(EVENTS.PAGE_VIEW, {
        page_location: window.location.href,
        page_title: document.title,
      });
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
