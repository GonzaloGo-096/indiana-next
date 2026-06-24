"use client";

/**
 * VehicleDetailClient - Client Component para detalle de vehículo
 *
 * ✅ MIGRADO: Usa CardDetalle profesional con mejoras mobile
 * ✅ INTEGRADO: Carruseles de vehículos similares (marca y precio)
 * ✅ PRESERVA SCROLL: Guarda posición antes de navegar y la restaura al volver
 *
 * @author Indiana Peugeot
 * @version 3.1.0 - Preservación de scroll implementada
 */

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CardDetalle } from "../../../../components/vehicles/Detail/CardDetalle/CardDetalle";
import SimilarVehiclesCarousel from "../../../../components/vehicles/SimilarVehiclesCarousel/SimilarVehiclesCarousel";
import PriceRangeCarousel from "../../../../components/vehicles/PriceRangeCarousel/PriceRangeCarousel";
import cta from "@/components/home/HomeSectionCtas.module.css";
import styles from "./vehicle-detail.module.css";

export default function VehicleDetailClient({ vehicle }) {
  const router = useRouter();

  const vehicleKey = vehicle?.id || vehicle?._id;

  // ✅ Scroll hacia arriba al cargar la página o cambiar de vehículo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [vehicleKey]);

  // Volver al listado preservando filtros y posición de scroll.
  // Si el usuario navegó dentro del sitio (history.length > 1), router.back()
  // vuelve al listado filtrado en su posición exacta. Pero si llegó por link
  // directo (WhatsApp, Google, pestaña nueva) no hay historial propio y back()
  // lo sacaría del sitio o no haría nada: en ese caso vamos al listado.
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/usados");
    }
  }, [router]);

  if (!vehicle) {
    return (
      <div className={styles.container}>
        <p>Vehículo no encontrado</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backRow}>
        <button
          type="button"
          onClick={handleBack}
          className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline}`}
          aria-label="Volver al listado de usados"
        >
          Atrás
        </button>
      </div>

      <div className={styles.content}>
        <CardDetalle auto={vehicle} />
      </div>

      <SimilarVehiclesCarousel currentVehicle={vehicle} />
      <PriceRangeCarousel currentVehicle={vehicle} />
    </div>
  );
}
