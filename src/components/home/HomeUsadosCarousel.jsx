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
import { useMemo } from "react";
import UsadosCarousel from "../usados/UsadosCarousel";
import ItemListViewTracker from "@/components/analytics/ItemListViewTracker";
import { SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";

export function HomeUsadosCarousel({ vehicles = [] }) {
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
        homeDesktopFourColumns
        trackingLocation={LOCATIONS.HOME}
        trackingListName={ITEM_LIST.HOME_FEATURED}
      />
    </>
  );
}
