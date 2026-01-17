"use client";

/**
 * VehicleDetailClient - Client Component para detalle de vehículo
 * 
 * ✅ MIGRADO: Usa CardDetalle profesional con mejoras mobile
 * ✅ INTEGRADO: Carruseles de vehículos similares (marca y precio)
 * 
 * @author Indiana Peugeot
 * @version 3.0.0 - Integrado con carruseles
 */

import Link from "next/link";
import { CardDetalle } from "../../../components/vehicles/Detail/CardDetalle/CardDetalle";
import SimilarVehiclesCarousel from "../../../components/vehicles/SimilarVehiclesCarousel/SimilarVehiclesCarousel";
import PriceRangeCarousel from "../../../components/vehicles/PriceRangeCarousel/PriceRangeCarousel";
import styles from "./vehicle-detail.module.css";

export default function VehicleDetailClient({ vehicle }) {
  if (!vehicle) {
    return (
      <div className={styles.container}>
        <p>Vehículo no encontrado</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/usados/vehiculos" className={styles.backLink}>
        ← Volver a la lista de usados
      </Link>

      <div className={styles.content}>
        <CardDetalle auto={vehicle} />
      </div>

      {/* Carruseles de vehículos similares */}
      <SimilarVehiclesCarousel currentVehicle={vehicle} />
      <PriceRangeCarousel currentVehicle={vehicle} />
    </div>
  );
}

