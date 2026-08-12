"use client";

/**
 * UsadosPageCarousel - Carrusel de usados en la página /usados
 *
 * En mobile imita al carrusel de usados del inicio (full-bleed, compact).
 * En desktop mantiene el carrusel contenido.
 *
 * @author Indiana Peugeot
 */
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import UsadosCarousel from "@/components/usados/UsadosCarousel";
import ItemListViewTracker from "@/components/analytics/ItemListViewTracker";
import { SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";

export default function UsadosPageCarousel({ vehicles = [] }) {
  const [mounted, setMounted] = useState(false);
  const isMobile = !useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  // Hasta montar, mostramos estilo desktop (contenido) para evitar flash en desktop
  const mobileStyleHome = mounted && isMobile;

  const trackedItems = useMemo(
    () =>
      vehicles
        .map((v) => buildItemParamsFromUsado(v, ITEM_LIST.USADOS_CAROUSEL))
        .filter(Boolean),
    [vehicles]
  );

  return (
    <div className="w-full min-w-0">
      <ItemListViewTracker
        items={trackedItems}
        location={LOCATIONS.USADOS_LIST}
        source={SOURCES.CAROUSEL}
        itemListName={ITEM_LIST.USADOS_CAROUSEL}
      />
      <UsadosCarousel
        vehicles={vehicles}
        compact={mobileStyleHome}
        viewportClip={mobileStyleHome}
        flushLeadingEdge
        trackingLocation={LOCATIONS.USADOS_LIST}
        trackingListName={ITEM_LIST.USADOS_CAROUSEL}
      />
    </div>
  );
}
