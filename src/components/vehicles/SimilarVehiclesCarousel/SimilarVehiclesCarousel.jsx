"use client";

/**
 * SimilarVehiclesCarousel - Vehículos de la misma marca.
 *
 * Quedó reducido a lo único que le es propio: de dónde salen los datos y cómo
 * se titula la sección. Todo el comportamiento del carrusel (scroll, flechas,
 * skeleton, estado de error) vive en VehicleCarousel, compartido con
 * PriceRangeCarousel. Antes eran 303 líneas casi idénticas a las 290 del otro.
 *
 * Conserva su propio módulo CSS: los dos carruseles NO son visualmente iguales
 * (difieren en márgenes y en la alineación del encabezado).
 *
 * @author Indiana Peugeot
 * @version 2.0.0 - Comportamiento extraído a VehicleCarousel
 */

import { useMemo } from "react";
import { useSimilarVehicles } from "../../../hooks/useSimilarVehicles";
import { VehicleCarousel } from "../VehicleCarousel/VehicleCarousel";
import styles from "./SimilarVehiclesCarousel.module.css";

export const SimilarVehiclesCarousel = ({ currentVehicle }) => {
  const { vehicles, isLoading, isError } = useSimilarVehicles(currentVehicle);

  const marcaLabel = useMemo(() => {
    const m = currentVehicle?.marca;
    if (!m || typeof m !== "string") return "";
    return m.trim();
  }, [currentVehicle]);

  const header = (
    <h2 className={styles.titleContainer}>
      <span className={styles.titleLabel}>Marca similar</span>
      {marcaLabel ? (
        <>
          <span className={styles.titleSep} aria-hidden="true">
            ·
          </span>
          <span className={styles.titleBrand}>{marcaLabel}</span>
        </>
      ) : null}
    </h2>
  );

  return (
    <VehicleCarousel
      vehicles={vehicles}
      isLoading={isLoading}
      isError={isError}
      styles={styles}
      testId="similar-vehicles-carousel"
      errorMessage="No se pudieron cargar los vehículos similares"
      header={header}
    />
  );
};

export default SimilarVehiclesCarousel;
