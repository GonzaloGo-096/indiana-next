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
  SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp']
}



