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
} from "../../utils/imageExtractors";

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
 * @param {Object} backendPage - Página cruda del backend
 * @param {number} currentCursor - Cursor actual (opcional)
 * @returns {Object} Página transformada: { vehicles, total, hasNextPage, nextPage }
 */
export const mapVehiclesPage = (backendPage, currentCursor = null) => {
  try {
    // ✅ Extraer estructura de paginación del backend (conocemos el formato)
    const {
      docs = [],
      totalDocs = 0,
      hasNextPage = false,
      nextPage: backendNextPage,
    } = backendPage?.allPhotos || {};

    // ✅ Mapear cada vehículo a formato frontend
    const vehicles = docs
      .map((v) => {
        if (!v || typeof v !== "object") return null;

        // ✅ OPTIMIZADO: Lista solo tiene fotoPrincipal y fotoHover (backend no envía fotosExtra)
        // Extracción simple y directa - solo busca donde realmente está
        const { principal, hover } = extractVehicleImageUrls(v);
        const allImages = extractAllImageUrls(v, { includeExtras: false }); // No buscar extras en lista

        return {
          // ✅ Passthrough completo de todos los campos del backend
          ...v,

          // Identificación
          id: v._id || v.id || 0,

          // ✅ Imágenes como strings (compatibilidad con componentes existentes)
          fotoPrincipal: principal || "",
          fotoHover: hover || "",
          imagen: principal || "", // Alias para compatibilidad
          imágenes: allImages,

          // Título compuesto (mantener por compatibilidad si se usa)
          title:
            v.marca && v.modelo
              ? `${String(v.marca).trim()} ${String(v.modelo).trim()}`
              : String(v.marca || v.modelo || "").trim(),
        };
      })
      .filter(Boolean);

    // ✅ CRÍTICO: Validar y corregir nextPage del backend
    // Si el backend devuelve un nextPage inválido (igual al currentCursor o menor),
    // calcularlo manualmente como currentCursor + 1
    let finalNextPage = null;
    if (hasNextPage) {
      if (backendNextPage && backendNextPage > (currentCursor || 0)) {
        // El backend devolvió un nextPage válido
        finalNextPage = backendNextPage;
      } else if (currentCursor !== null && currentCursor !== undefined) {
        // El backend no devolvió un nextPage válido, calcularlo manualmente
        finalNextPage = currentCursor + 1;
        if (process.env.NODE_ENV === 'development') {
          console.warn("[Mapper] Backend devolvió nextPage inválido, calculando manualmente", {
            backendNextPage,
            currentCursor,
            calculatedNextPage: finalNextPage
          });
        }
      } else {
        // No hay currentCursor, usar el del backend aunque sea inválido
        finalNextPage = backendNextPage || null;
      }
    }

    return {
      vehicles,
      totalDocs: totalDocs || 0,
      total: totalDocs || 0, // Alias para compatibilidad
      hasNextPage: Boolean(hasNextPage),
      nextPage: finalNextPage, // ✅ nextPage validado y corregido si es necesario
      currentCursor: currentCursor || undefined,
      totalPages: Math.ceil((totalDocs || 0) / 12),
    };
  } catch (error) {
    console.error(
      "[Mapper] Error transformando página de vehículos:",
      error.message,
      { page: backendPage }
    );

    // ✅ Fallback seguro en caso de error
    return {
      vehicles: [],
      total: 0,
      hasNextPage: false,
      nextPage: null,
      currentCursor: currentCursor || undefined,
      totalPages: 0,
    };
  }
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

  try {
    // ✅ OPTIMIZADO: Detalle incluye fotoPrincipal, fotoHover y fotosExtra
    // Extracción específica - solo busca en campos que el backend realmente usa
    const { principal, hover } = extractVehicleImageUrls(backendVehicle);
    const allImages = extractAllImageUrls(backendVehicle, { includeExtras: true }); // Incluir extras en detalle

    return {
      // ✅ Passthrough completo: conservar todas las claves del backend
      ...backendVehicle,

      // Identificación
      id: backendVehicle._id || backendVehicle.id || 0,

      // ✅ Imágenes como strings (compatibilidad con componentes existentes)
      fotoPrincipal: principal || "",
      fotoHover: hover || "",
      imagen: principal || "", // Alias para compatibilidad
      imágenes: allImages,
    };
  } catch (error) {
    console.error(
      "[Mapper] Error transformando vehículo:",
      error.message
    );
    return null;
  }
};

