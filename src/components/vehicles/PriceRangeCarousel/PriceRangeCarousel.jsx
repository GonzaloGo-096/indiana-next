"use client";

/**
 * PriceRangeCarousel - Vehículos con precio similar (±1 millón).
 *
 * Quedó reducido a lo único que le es propio: de dónde salen los datos y cómo
 * se titula la sección. Todo el comportamiento del carrusel (scroll, flechas,
 * skeleton, estado de error) vive en VehicleCarousel, compartido con
 * SimilarVehiclesCarousel. Antes eran 290 líneas casi idénticas a las 303 del
 * otro.
 *
 * Conserva su propio módulo CSS: los dos carruseles NO son visualmente iguales
 * (difieren en márgenes y en la alineación del encabezado).
 *
 * @author Indiana Peugeot
 * @version 2.0.0 - Comportamiento extraído a VehicleCarousel
 */

import { usePriceRangeVehicles } from "@/hooks/usePriceRangeVehicles";
import { VehicleCarousel } from "../VehicleCarousel/VehicleCarousel";
import styles from "./PriceRangeCarousel.module.css";

export const PriceRangeCarousel = ({ currentVehicle }) => {
  // El hook también devuelve `priceRange`, pero el encabezado no lo muestra:
  // antes se desestructuraba sin usarlo.
  const { vehicles, isLoading, isError } = usePriceRangeVehicles(currentVehicle);

  const header = (
    <div className={styles.titleContainer}>
      <h2 className={styles.title}>Precio similar</h2>
    </div>
  );

  return (
    <VehicleCarousel
      vehicles={vehicles}
      isLoading={isLoading}
      isError={isError}
      styles={styles}
      testId="price-range-carousel"
      errorMessage="No se pudieron cargar los vehículos"
      header={header}
    />
  );
};

export default PriceRangeCarousel;
