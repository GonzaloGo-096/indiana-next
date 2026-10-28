"use client";

/**
 * UsadosPageCarousel - Carrusel de usados en la página /usados
 *
 * En mobile imita al carrusel de usados del inicio (full-bleed, compact).
 * En desktop mantiene el carrusel contenido.
 */
import UsadosCarousel from "@/components/usados/UsadosCarousel";

export default function UsadosPageCarousel({ vehicles = [] }) {
  return (
    <div className="w-full min-w-0">
      <UsadosCarousel
        vehicles={vehicles}
        flushLeadingEdge
      />
    </div>
  );
}
