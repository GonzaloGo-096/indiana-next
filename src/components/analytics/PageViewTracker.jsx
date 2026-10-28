"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/dataLayer";
import { urlSinDatosPersonales } from "@/lib/analytics/urlLimpia";
import { EVENTS, LOCATIONS } from "@/lib/analytics/events";
import { locationFromPathname } from "@/lib/analytics/locationFromPath";
import { onAnalyticsGranted } from "@/lib/analytics/consent";
import { rememberEntryCampaign, withEntryCampaign } from "@/lib/analytics/campanaEntrada";
import {
  forgetPageItemUnless,
  getPageItem,
  hasPageItemFor,
  onPageItem,
} from "@/lib/analytics/pageItem";

/**
 * Registra `page_view` al entrar y en cada cambio de página.
 *
 * Por qué desde el código y no con la medición mejorada de GA4 (que también
 * manda una visita por cada cambio de historial, comprobado en producción el
 * 2026-10-07): esa cuenta además cada filtro del listado y el salto de la
 * redirección de usados. Por eso en GTM la etiqueta de Google tiene el
 * page_view automático APAGADO y en GA4 se apaga "cambios de página según el
 * historial" el mismo día que se publica: con cualquiera de los dos prendido,
 * las visitas se cuentan doble.
 *
 * Solo mira la ruta, no la query: aplicar filtros en usados no es otra visita.
 *
 * En las fichas (0km, usado, plan) espera a que la ficha real se arme, que es
 * cuando ItemViewTracker anota el auto. Las cards de usados linkean sin la
 * versión y la ficha redirige a su URL canónica cuando responde el servidor;
 * con una espera fija, si el servidor tardaba más que la espera, una visita
 * contaba como dos y la primera llevaba el título de la página anterior
 * (reproducido con navegador el 2026-10-07). Si la ficha no llega a armarse
 * (por ejemplo un 404), la visita se cuenta igual a los FICHA_MAX_MS.
 *
 * En el resto de las páginas espera SETTLE_MS para tomar el título nuevo.
 * Costo aceptado: quien se va antes no cuenta como visita.
 */
export const SETTLE_MS = 500;
export const FICHA_MAX_MS = 8000;

const FICHAS = new Set([LOCATIONS.OKM_DETAIL, LOCATIONS.USADOS_DETAIL, LOCATIONS.PLAN_DETAIL]);

function contarVisita(href = window.location.href) {
  track(EVENTS.PAGE_VIEW, {
    page_location: urlSinDatosPersonales(href),
    page_title: document.title,
  });
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef(null);

  // Quien acepta las cookies después de que salió la visita: esa visita y el
  // auto de la ficha se mandaron sin cookies (fuera de los informes), así que
  // se vuelven a contar. Si la visita todavía no salió, sale sola, ya aceptada.
  useEffect(
    () =>
      onAnalyticsGranted(() => {
        if (last.current !== window.location.pathname) return;
        contarVisita(withEntryCampaign(window.location.href));
        const item = getPageItem();
        if (item) track(EVENTS.VIEW_ITEM, item);
      }),
    [],
  );

  useEffect(() => {
    if (!pathname) return undefined;
    rememberEntryCampaign();
    forgetPageItemUnless(pathname);
    if (last.current === pathname) return undefined;
    const enviar = () => {
      if (last.current === pathname) return;
      last.current = pathname;
      contarVisita();
    };

    if (!FICHAS.has(locationFromPathname(pathname))) {
      const t = setTimeout(enviar, SETTLE_MS);
      return () => clearTimeout(t);
    }

    // El título de la ficha llega junto con su contenido: un instante después
    // del aviso ya está puesto.
    let t = null;
    const listo = () => {
      clearTimeout(t);
      t = setTimeout(enviar, 0);
    };
    if (hasPageItemFor(pathname)) listo();
    const dejar = onPageItem((ruta) => {
      if (ruta === pathname) listo();
    });
    const tope = setTimeout(enviar, FICHA_MAX_MS);
    return () => {
      dejar();
      clearTimeout(t);
      clearTimeout(tope);
    };
  }, [pathname]);
  return null;
}
