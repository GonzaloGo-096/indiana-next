"use client";

/**
 * usePriceRangeVehicles - Hook para obtener vehículos en rango de precio similar
 * 
 * Obtiene vehículos con precio similar (±1 millón), excluyendo el vehículo actual.
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { useState, useEffect, useMemo } from "react";
import { vehiclesService } from "../lib/services/vehiclesApi";
import { mapVehiclesPage } from "../lib/mappers/vehicleMapper";
import { VEHICLE_CONSTANTS } from "../constants/vehicles";

/**
 * Hook para obtener vehículos en rango de precio similar
 * @param {Object} currentVehicle - Vehículo actual
 * @returns {Object} { vehicles, priceRange, isLoading, isError, error }
 */
export const usePriceRangeVehicles = (currentVehicle) => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  // Verificar si hay precio válido
  const currentPrice = currentVehicle?.precio;
  const hasValidPrice = typeof currentPrice === "number" && currentPrice > 0;
  const currentId = currentVehicle?.id || currentVehicle?._id;

  // Construir filtro de precio
  const filters = useMemo(() => {
    if (!hasValidPrice) {
      return {};
    }

    // Calcular rango: precio ± rango configurado
    const minPrice = Math.max(0, currentPrice - VEHICLE_CONSTANTS.PRICE_RANGE);
    const maxPrice = currentPrice + VEHICLE_CONSTANTS.PRICE_RANGE;

    return {
      precio: [minPrice, maxPrice],
    };
  }, [currentPrice, hasValidPrice]);

  // Formatear el rango de precio para mostrar en UI
  const priceRange = useMemo(() => {
    if (!hasValidPrice) return null;

    const minPrice = Math.max(0, currentPrice - VEHICLE_CONSTANTS.PRICE_RANGE);
    const maxPrice = currentPrice + VEHICLE_CONSTANTS.PRICE_RANGE;

    return {
      min: minPrice,
      max: maxPrice,
      formatted: {
        min: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(minPrice),
        max: new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(maxPrice),
      },
    };
  }, [currentPrice, hasValidPrice]);

  useEffect(() => {
    if (!hasValidPrice) {
      setIsLoading(false);
      setVehicles([]);
      return;
    }

    let isMounted = true;

    const fetchPriceRangeVehicles = async () => {
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
          console.error("[usePriceRangeVehicles] Error:", err);
        }
        setIsError(true);
        setError(err.message || "Error al cargar vehículos");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPriceRangeVehicles();

    return () => {
      isMounted = false;
    };
  }, [filters, currentId, hasValidPrice]);

  return {
    vehicles,
    priceRange,
    isLoading,
    isError,
    error,
  };
};


