/**
 * imageBlur.js - Utilidades para generar blur placeholders de imágenes
 * 
 * Genera URLs de blur placeholder para imágenes de Cloudinary
 * Compatible con next/image placeholder="blur"
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

/**
 * Genera una URL de blur placeholder desde una URL de Cloudinary
 * 
 * @param {string} imageUrl - URL completa de la imagen en Cloudinary
 * @returns {string} URL del blur placeholder
 * 
 * @example
 * generateBlurPlaceholder('https://res.cloudinary.com/.../image.jpg')
 * // → 'https://res.cloudinary.com/.../w_20,q_10,e_blur:2000/image.jpg'
 */
export function generateBlurPlaceholder(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '';
  }

  // Si ya es una URL de Cloudinary con transformaciones
  if (imageUrl.includes('res.cloudinary.com')) {
    // Extraer el public_id y las transformaciones existentes
    const cloudinaryMatch = imageUrl.match(
      /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/([^/]+)\/(.+)/
    );

    if (cloudinaryMatch) {
      const [, existingTransforms, publicId] = cloudinaryMatch;
      
      // Agregar transformaciones de blur al inicio
      const blurTransforms = 'w_20,q_10,e_blur:2000';
      const finalPublicId = publicId.includes('/') ? publicId : publicId;
      
      // Construir URL con blur
      const baseUrl = imageUrl.split('/image/upload')[0];
      return `${baseUrl}/image/upload/${blurTransforms}/${finalPublicId}`;
    }

    // Si no tiene transformaciones, agregarlas
    const simpleMatch = imageUrl.match(
      /https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)/
    );

    if (simpleMatch) {
      const [, cloudName, publicId] = simpleMatch;
      const blurTransforms = 'w_20,q_10,e_blur:2000';
      return `https://res.cloudinary.com/${cloudName}/image/upload/${blurTransforms}/${publicId}`;
    }
  }

  // Si no es Cloudinary, retornar string vacío (Next.js generará uno automático)
  return '';
}

/**
 * Genera un blur placeholder base64 simple (fallback)
 * Retorna un data URL de 1x1 pixel gris
 * 
 * @returns {string} Data URL del placeholder
 */
export function generateSimpleBlurDataURL() {
  // 1x1 pixel gris en base64 (muy pequeño, ~100 bytes)
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';
}

/**
 * Obtiene el blur placeholder para una imagen
 * Intenta generar desde Cloudinary, si falla usa el simple
 * 
 * @param {string} imageUrl - URL de la imagen
 * @returns {string} URL del blur placeholder o data URL
 */
export function getBlurPlaceholder(imageUrl) {
  const cloudinaryBlur = generateBlurPlaceholder(imageUrl);
  if (cloudinaryBlur) {
    return cloudinaryBlur;
  }
  return generateSimpleBlurDataURL();
}


