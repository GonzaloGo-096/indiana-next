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
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef(null);
  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    track(EVENTS.PAGE_VIEW, {
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);
  return null;
}
