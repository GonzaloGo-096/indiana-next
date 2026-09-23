/**
 * vehicleMapper.js - Mapper: Transformación de datos backend → frontend
 * 
 * ✅ PROPÓSITO: Transformación de datos con optimización de performance
 * - Usa extractors (CAPA 1) para velocidad: ~2-3 ops/vehículo
 * - Passthrough completo: conserva todos los campos del backend
 * - Consistencia: mismo formato entre lista y detalle
 * 
 * 📋 RESPONSABILIDADES:
 * - Transformar página de vehículos (mapVehiclesPage)
 * - Transformar vehículo individual (mapVehicle)
 * - Extraer URLs de imágenes usando extractors (performance)
 * - Mantener compatibilidad con componentes existentes
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

import {
  extractVehicleImageUrls,
  extractAllImageUrls,
} from "@/utils/imageExtractors";
import { VEHICLE_CONSTANTS } from "@/constants/vehicles";
import { createLogger } from "../logger";

const log = createLogger("mapper:vehicle");

/**
 * Transforma una página de vehículos del backend al formato frontend
 * 
 * Estructura backend esperada:
 * {
 *   allPhotos: {
 *     docs: [{ _id, marca, modelo, precio, anio, ... }],
 *     totalDocs: number,
 *     hasNextPage: boolean,
 *     nextPage: number
 *   }
 * }
 * 
 * Si la respuesta no tiene esa forma, lanza. Antes devolvía una página vacía,
 * y una falla del backend (cuerpo vacío, JSON sin allPhotos) se mostraba como
 * "No se encontraron vehículos". Una lista vacía de verdad llega como
 * { allPhotos: { docs: [] } } y sí es un resultado válido.
 *
 * @param {Object} backendPage - Página cruda del backend
 * @param {number} currentCursor - Cursor actual (opcional)
 * @returns {Object} Página transformada: { vehicles, total, hasNextPage, nextPage }
 */
export const mapVehiclesPage = (backendPage, currentCursor = null) => {
  const allPhotos = backendPage?.allPhotos;
  if (!allPhotos || typeof allPhotos !== "object" || !Array.isArray(allPhotos.docs)) {
    throw new Error("Página de vehículos inválida: falta allPhotos.docs");
  }

  const {
    docs,
    totalDocs = 0,
    hasNextPage = false,
    nextPage: backendNextPage,
  } = allPhotos;

  const vehicles = docs
    .map((v) => {
      if (!v || typeof v !== "object") return null;

      // La lista solo trae fotoPrincipal y fotoHover (el backend no manda fotosExtra).
      const { principal, hover } = extractVehicleImageUrls(v);
      const allImages = extractAllImageUrls(v, { includeExtras: false });

      return {
        // Passthrough: se conservan todas las claves del backend.
        ...v,
        id: v._id || v.id || 0,
        // Imágenes como strings, que es lo que esperan los componentes.
        fotoPrincipal: principal || "",
        fotoHover: hover || "",
        imagen: principal || "",
        imágenes: allImages,
        title:
          v.marca && v.modelo
            ? `${String(v.marca).trim()} ${String(v.modelo).trim()}`
            : String(v.marca || v.modelo || "").trim(),
      };
    })
    .filter(Boolean);

  // Si el backend devuelve un nextPage inválido (igual o menor al cursor
  // actual), se calcula como currentCursor + 1.
  let finalNextPage = null;
  if (hasNextPage) {
    if (backendNextPage && backendNextPage > (currentCursor || 0)) {
      finalNextPage = backendNextPage;
    } else if (currentCursor !== null && currentCursor !== undefined) {
      finalNextPage = currentCursor + 1;
      log.debug("El backend devolvió un nextPage inválido; se calcula a mano.", {
        backendNextPage,
        currentCursor,
      });
    } else {
      finalNextPage = backendNextPage || null;
    }
  }

  return {
    vehicles,
    totalDocs: totalDocs || 0,
    total: totalDocs || 0,
    hasNextPage: Boolean(hasNextPage),
    nextPage: finalNextPage,
    currentCursor: currentCursor || undefined,
    totalPages: Math.ceil((totalDocs || 0) / VEHICLE_CONSTANTS.LIST_PAGE_SIZE),
  };
};

/**
 * Transforma un vehículo individual del backend
 * Útil para casos donde solo necesitas mapear 1 vehículo
 * 
 * @param {Object} backendVehicle - Vehículo del backend
 * @returns {Object|null} Vehículo transformado o null si es inválido
 */
export const mapVehicle = (backendVehicle) => {
  if (!backendVehicle || typeof backendVehicle !== "object") {
    return null;
  }

  // Sin try/catch a propósito: si el mapeo falla, que falle. Antes devolvía
  // null y la ficha lo tomaba como "el auto no existe": un bug terminaba en
  // un 404 con noindex sobre un auto real.
  const { principal, hover } = extractVehicleImageUrls(backendVehicle);
  const allImages = extractAllImageUrls(backendVehicle, { includeExtras: true });

  return {
    // Passthrough: se conservan todas las claves del backend.
    ...backendVehicle,
    id: backendVehicle._id || backendVehicle.id || 0,
    // Imágenes como strings, que es lo que esperan los componentes.
    fotoPrincipal: principal || "",
    fotoHover: hover || "",
    imagen: principal || "",
    imágenes: allImages,
  };
};

