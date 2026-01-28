/**
 * colores.js - Catálogo de colores disponibles para modelos 0km
 * 
 * Centraliza todos los colores con sus imágenes de Cloudinary.
 * Cada color tiene un key único, label para UI, y publicId opcional.
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

/**
 * Catálogo de colores
 * - key: identificador único (usado en código)
 * - label: nombre para mostrar en UI
 * - hex: color para el selector visual
 * - publicId: ID de Cloudinary (null si no hay imagen)
 */
export const COLORES = {
  // ═══════════════════════════════════════════════════════════════
  // COLORES DEL 2008
  // ═══════════════════════════════════════════════════════════════
  'gris-selenium': {
    key: 'gris-selenium',
    label: 'Gris Selenium',
    hex: '#6B7280',
    publicId: 'gris-selenium-frontal_bbgybh',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208537/gris-selenium-frontal_bbgybh.webp'
  },
  'blanco-nacre': {
    key: 'blanco-nacre',
    label: 'Blanco Nacre',
    hex: '#F5F5F0',
    publicId: 'blanco-nacre-frontal_spbnph',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208530/blanco-nacre-frontal_spbnph.webp'
  },
  'gris-artense': {
    key: 'gris-artense',
    label: 'Gris Artense',
    hex: '#9CA3AF',
    publicId: 'gris-artense-frontal_eablzc',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208544/gris-artense-frontal_eablzc.webp'
  },
  'negro': {
    key: 'negro',
    label: 'Negro',
    hex: '#1F2937',
    publicId: 'negro-perla-frontal_tb7di0',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208524/negro-perla-frontal_tb7di0.webp'
  },

  // ═══════════════════════════════════════════════════════════════
  // COLORES DEL 3008
  // ═══════════════════════════════════════════════════════════════
  '3008-azul-ingaro': {
    key: '3008-azul-ingaro',
    label: 'Azul Ingaro',
    hex: '#2C3E50',
    publicId: '3008-azul-ingaro-frente_bxxlav',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767209164/3008-azul-ingaro-frente_bxxlav.webp'
  },
  '3008-gris-titanium': {
    key: '3008-gris-titanium',
    label: 'Gris Titanium',
    hex: '#4A4A4A',
    publicId: '3008-gris-titanium-frente_gkzcpg',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767209150/3008-gris-titanium-frente_gkzcpg.webp'
  },
  '3008-azul-obsession': {
    key: '3008-azul-obsession',
    label: 'Azul Obsession',
    hex: '#1E3A5F',
    publicId: '3008-azul-obsession-frente_x6zuus',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767209157/3008-azul-obsession-frente_x6zuus.webp'
  },
  '3008-gris-artense': {
    key: '3008-gris-artense',
    label: 'Gris Artense',
    hex: '#9CA3AF',
    publicId: '3008-gris-artense-frente_gawphy',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767209171/3008-gris-artense-frente_gawphy.webp'
  },
  '3008-negro-perla': {
    key: '3008-negro-perla',
    label: 'Negro Perla',
    hex: '#1C1C1C',
    publicId: '3008-negro-perla-frente_p967gs',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767209186/3008-negro-perla-frente_p967gs.webp'
  },
  '3008-blanco-okenite': {
    key: '3008-blanco-okenite',
    label: 'Blanco Okenite',
    hex: '#F5F5F0',
    publicId: '3008-blanco-okenite-frente_h7cpe1',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767209178/3008-blanco-okenite-frente_h7cpe1.webp'
  },

  // ═══════════════════════════════════════════════════════════════
  // COLORES DEL 5008
  // ═══════════════════════════════════════════════════════════════
  '5008-blanco-okenite': {
    key: '5008-blanco-okenite',
    label: 'Blanco Okenite',
    hex: '#F5F5F0',
    publicId: '5008-blanco-okenite-frente_tgi9pq',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208349/5008-blanco-okenite-frente_tgi9pq.webp'
  },
  '5008-azul-ingaro': {
    key: '5008-azul-ingaro',
    label: 'Azul Ingaro',
    hex: '#2C3E50',
    publicId: '5008-azul-ingaro-frente_ftm4xo',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208329/5008-azul-ingaro-frente_ftm4xo.webp'
  },
  '5008-negro-perla': {
    key: '5008-negro-perla',
    label: 'Negro Perla',
    hex: '#1C1C1C',
    publicId: '5008-negro-perla-frente_pvdnxb',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208323/5008-negro-perla-frente_pvdnxb.webp'
  },
  '5008-gris-artense': {
    key: '5008-gris-artense',
    label: 'Gris Artense',
    hex: '#9CA3AF',
    publicId: '5008-gris-artense-frente_krzqln',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208355/5008-gris-artense-frente_krzqln.webp'
  },
  '5008-azul-obsession': {
    key: '5008-azul-obsession',
    label: 'Azul Obsession',
    hex: '#1E3A5F',
    publicId: '5008-azul-obsession-frente_nsesdo',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208336/5008-azul-obsession-frente_nsesdo.webp'
  },
  '5008-gris-titanium': {
    key: '5008-gris-titanium',
    label: 'Gris Titanium',
    hex: '#4A4A4A',
    publicId: '5008-gris-titanium-frente_nnpkwg',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208317/5008-gris-titanium-frente_nnpkwg.webp'
  },

  // ═══════════════════════════════════════════════════════════════
  // COLORES DEL 408
  // ═══════════════════════════════════════════════════════════════
  '408-blanco-okenite': {
    key: '408-blanco-okenite',
    label: 'Blanco Okenite',
    hex: '#F5F5F0',
    publicId: '408-blanco-okenite-frente2_s5ofk8',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208428/408-blanco-okenite-frente2_s5ofk8.webp'
  },
  '408-azul-obsession': {
    key: '408-azul-obsession',
    label: 'Azul Obsession',
    hex: '#1E3A5F',
    publicId: '408-azul-obsession-frente2_affayl',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208435/408-azul-obsession-frente2_affayl.webp'
  },
  '408-negro-perla': {
    key: '408-negro-perla',
    label: 'Negro Perla',
    hex: '#1C1C1C',
    publicId: '408-negro-perla-frente2_xiekaf',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208416/408-negro-perla-frente2_xiekaf.webp'
  },
  '408-gris-selenium': {
    key: '408-gris-selenium',
    label: 'Gris Selenium',
    hex: '#6B7280',
    publicId: '408-gris-selenium-frente2_s4pkn2',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767208422/408-gris-selenium-frente2_s4pkn2.webp'
  },

  // ═══════════════════════════════════════════════════════════════
  // COLORES DEL 208
  // ═══════════════════════════════════════════════════════════════
  '208-blanco-nacre': {
    key: '208-blanco-nacre',
    label: 'Blanco Nacre',
    hex: '#F5F5F0',
    publicId: 'blanco-nacre-frontal2_sbm9lg',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767119091/blanco-nacre-frontal2_sbm9lg.webp'
  },
  '208-negro-perla': {
    key: '208-negro-perla',
    label: 'Negro Perla',
    hex: '#1C1C1C',
    publicId: 'negro-perla-frontal2_arxldy',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767119083/negro-perla-frontal2_arxldy.webp'
  },
  '208-gris-artense': {
    key: '208-gris-artense',
    label: 'Gris Artense',
    hex: '#9CA3AF',
    publicId: 'gris-artense-frontal2_vkzr7h',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767119075/gris-artense-frontal2_vkzr7h.webp'
  }
}

/**
 * Obtener color por key
 * @param {string} colorKey - Key del color
 * @returns {Object|null} - Objeto color o null
 */
export const getColor = (colorKey) => COLORES[colorKey] || null

/**
 * Obtener imagen de un color (con fallback)
 * @param {string} colorKey - Key del color
 * @param {string} fallbackUrl - URL de fallback si no hay imagen
 * @returns {string|null} - URL de la imagen
 */
export const getColorImage = (colorKey, fallbackUrl = null) => {
  const color = COLORES[colorKey]
  return color?.url || fallbackUrl
}



