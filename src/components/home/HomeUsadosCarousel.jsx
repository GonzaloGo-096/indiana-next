"use client";

/**
 * HomeUsadosCarousel - Carrusel de usados solo para la sección de inicio
 *
 * Mobile: mismo estilo y espaciado que hasta ahora (viewportClip + compact).
 * Desktop: sin viewportClip; cards un poco más angostas que /usados para ver 4 a la vez
 *          en el ancho ampliado del home (solo inicio).
 *
 * @author Indiana Peugeot
 */
import { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import UsadosCarousel from "../usados/UsadosCarousel";
import ItemListViewTracker from "@/components/analytics/ItemListViewTracker";
import { SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";

export function HomeUsadosCarousel({ vehicles = [] }) {
  const [mounted, setMounted] = useState(false);
  const isMobile = !useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  // Mobile: viewportClip + compact (estilos y espaciado actuales del inicio).
  // Desktop: sin viewportClip y sin compact; .carouselHomeDesktopFour solo aplica en CSS ≥992px.
  const useMobileStyle = mounted && isMobile;

  const trackedItems = useMemo(
    () =>
      vehicles
        .map((v) => buildItemParamsFromUsado(v, ITEM_LIST.HOME_FEATURED))
        .filter(Boolean),
    [vehicles]
  );

  return (
    <>
      <ItemListViewTracker
        items={trackedItems}
        location={LOCATIONS.HOME}
        source={SOURCES.CAROUSEL}
        itemListName={ITEM_LIST.HOME_FEATURED}
      />
      <UsadosCarousel
        vehicles={vehicles}
        compact={useMobileStyle}
        viewportClip={useMobileStyle}
        homeDesktopFourColumns
        trackingLocation={LOCATIONS.HOME}
        trackingListName={ITEM_LIST.HOME_FEATURED}
      />
    </>
  );
}
