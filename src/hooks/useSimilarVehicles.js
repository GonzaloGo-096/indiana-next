"use client";

/**
 * useSimilarVehicles - Hook para obtener vehículos similares por marca
 * 
 * Obtiene vehículos de la misma marca, excluyendo el vehículo actual.
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from "react";
import { vehiclesService } from "../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../lib/mappers/vehicleMapper";
import { VEHICLE_CONSTANTS } from "../constants/vehicles";

/**
 * Hook para obtener vehículos similares por marca
 * @param {Object} currentVehicle - Vehículo actual
 * @returns {Object} { vehicles, isLoading, isError, error }
 */
export const useSimilarVehicles = (currentVehicle) => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  // Verificar si hay marca antes de hacer la petición
  const hasBrand = Boolean(currentVehicle?.marca);
  const currentId = currentVehicle?.id || currentVehicle?._id;

  // Construir filtro de marca
  const filters = useMemo(() => {
    if (!hasBrand) {
      return {};
    }
    return {
      marca: [currentVehicle.marca],
    };
  }, [currentVehicle?.marca, hasBrand]);

  useEffect(() => {
    if (!hasBrand) {
      setIsLoading(false);
      setVehicles([]);
      return;
    }

    let isMounted = true;

    const fetchSimilarVehicles = async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        // Pedir más vehículos para asegurar el máximo después de excluir el actual
        const backendData = await vehiclesService.getVehicles({
          filters,
          limit: VEHICLE_CONSTANTS.SIMILAR_FETCH_LIMIT,
          cursor: 1,
        });

        const mappedData = mapVehiclesPage(backendData, 1);

        if (!isMounted) return;

        // Excluir el vehículo actual y limitar al máximo permitido
        const filtered = mappedData.vehicles
          .filter((vehicle) => {
            const vehicleId = vehicle.id || vehicle._id;
            return vehicleId !== currentId;
          })
          .slice(0, VEHICLE_CONSTANTS.SIMILAR_MAX_RESULTS);

        setVehicles(filtered);
      } catch (err) {
        if (!isMounted) return;
        if (process.env.NODE_ENV === 'development') {
          console.error("[useSimilarVehicles] Error:", err);
        }
        setIsError(true);
        setError(err.message || "Error al cargar vehículos similares");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSimilarVehicles();

    return () => {
      isMounted = false;
    };
  }, [filters, currentId, hasBrand]);

  return {
    vehicles,
    isLoading,
    isError,
    error,
  };
};


