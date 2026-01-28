/**
 * carouselImages.js - Helper para obtener imágenes del carrusel
 * 
 * ✅ PROPÓSITO: Obtener todas las imágenes para el carrusel de detalle
 * - Combina fotoPrincipal, fotoHover y fotosExtra
 * - Elimina duplicados
 * - Retorna array de URLs (strings) para compatibilidad con Next.js Image
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { extractAllImageUrls } from "./imageExtractors";

const DEFAULT_CAR_IMAGE = "/assets/logos/logos-indiana/desktop/logo-chico-solid.webp";

/**
 * Obtiene todas las imágenes para el carrusel de un vehículo
 * Incluye fotoPrincipal, fotoHover y fotosExtra con deduplicación
 * 
 * @param {Object} vehicle - Objeto del vehículo
 * @returns {Array<string>} Array de URLs de imágenes
 */
export const getCarouselImages = (vehicle) => {
  // Validación robusta
  if (!vehicle || typeof vehicle !== "object" || Array.isArray(vehicle)) {
    return [DEFAULT_CAR_IMAGE];
  }

  try {
    // Extraer todas las URLs (incluye extras)
    const allUrls = extractAllImageUrls(vehicle, {
      includeExtras: true,
      filterDuplicates: true,
    });

    // Retornar imágenes o fallback
    if (allUrls.length > 0) {
      return allUrls;
    }

    // Fallback a imagen por defecto
    return [DEFAULT_CAR_IMAGE];
  } catch (error) {
    console.error("[CarouselImages] Error al procesar imágenes:", error.message);
    return [DEFAULT_CAR_IMAGE];
  }
};



