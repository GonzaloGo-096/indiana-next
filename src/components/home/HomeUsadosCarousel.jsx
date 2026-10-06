"use client";

/**
 * HomeUsadosCarousel - Carrusel de usados solo para la sección de inicio
 *
 * Mobile: mismo estilo y espaciado que hasta ahora (viewportClip + compact).
 * Desktop: sin viewportClip; cards un poco más angostas que /usados para ver 4 a la vez
 *          en el ancho ampliado del home (solo inicio).
 */
import UsadosCarousel from "../usados/UsadosCarousel";

export function HomeUsadosCarousel({ vehicles = [] }) {
  return (
    <>
      <UsadosCarousel
        vehicles={vehicles}
        homeDesktopFourColumns
      />
    </>
  );
}
