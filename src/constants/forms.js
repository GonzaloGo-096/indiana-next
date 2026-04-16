/**
 * Form validation constants for admin forms
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Soporta JPG, PNG y WEBP
 */
export const FORM_RULES = {
  // Fotos extras son opcionales, solo se valida el máximo
  MAX_EXTRA_PHOTOS: 8,
  // Solo se requieren las 2 fotos principales (fotoPrincipal + fotoHover)
  REQUIRED_PHOTOS: 2,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  /** Máximo lado (px) en cliente; coherente con Sharp en /api/photos/create */
  CLIENT_OPTIMIZE_MAX_EDGE: 1200,
  /** Calidad WebP 0–1 (browser-image-compression) */
  CLIENT_OPTIMIZE_WEBP_QUALITY: 0.85,
}



