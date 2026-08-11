"use client";

import { useEffect, useState } from "react";
import { UsadosSection } from "./UsadosSection";
import { vehiclesService } from "@/lib/services/vehiclesApi";
import { mapVehiclesPage } from "@/lib/mappers/vehicleMapper";

/**
 * Carga la sección de usados en cliente para evitar bloquear el SSR del home.
 */
export function HomeUsadosSectionClient() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadVehicles = async () => {
      try {
        const backendData = await vehiclesService.getVehicles({
          filters: {},
          limit: 6,
          cursor: 1,
          signal: controller.signal,
        });

        const mappedData = mapVehiclesPage(backendData, 1);
        setVehicles(mappedData.vehicles || []);
      } catch (error) {
        // Ignorar errores de aborto para evitar ruido al desmontar
        if (error?.name === "CanceledError" || error?.name === "AbortError") return;

        if (process.env.NODE_ENV === "development") {
          console.error("[Home] Error fetching usados:", error);
        }
      }
    };

    loadVehicles();
    return () => controller.abort();
  }, []);

  return <UsadosSection vehicles={vehicles} />;
}

