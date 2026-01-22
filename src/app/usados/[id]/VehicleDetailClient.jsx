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
import { CardDetalle } from "../../../components/vehicles/Detail/CardDetalle/CardDetalle";
import SimilarVehiclesCarousel from "../../../components/vehicles/SimilarVehiclesCarousel/SimilarVehiclesCarousel";
import PriceRangeCarousel from "../../../components/vehicles/PriceRangeCarousel/PriceRangeCarousel";
import styles from "./vehicle-detail.module.css";

export default function VehicleDetailClient({ vehicle }) {
  const router = useRouter();

  // ✅ Scroll hacia arriba al cargar la página o cambiar de vehículo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [vehicle?.id || vehicle?._id]);

  // ✅ Función para volver preservando scroll
  const handleBack = useCallback(() => {
    // La posición ya está guardada cuando se hizo clic en la card
    // Solo navegar de vuelta
    router.push("/usados/vehiculos");
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
      <div className={styles.backButton}>
        <button onClick={handleBack} className={styles.backLink}>
          Lista completa
        </button>
      </div>

      <div className={styles.content}>
        <CardDetalle auto={vehicle} />
      </div>

      {/* Carruseles de vehículos similares */}
      <SimilarVehiclesCarousel currentVehicle={vehicle} />
      <PriceRangeCarousel currentVehicle={vehicle} />
    </div>
  );
}

