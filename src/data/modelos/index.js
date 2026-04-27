/**
 * modelos/index.js - Índice de modelos 0km
 * 
 * Centraliza el acceso a todos los modelos disponibles.
 * Permite agregar nuevos modelos fácilmente.
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Todos los modelos registrados
 */

import { PEUGEOT_208 } from './peugeot208'
import { PEUGEOT_2008 } from './peugeot2008'
import { PEUGEOT_3008 } from './peugeot3008'
import { PEUGEOT_408 } from './peugeot408'
import { PEUGEOT_5008 } from './peugeot5008'
import { PEUGEOT_PARTNER } from './peugeotPartner'
import { PEUGEOT_EXPERT } from './peugeotExpert'
import { PEUGEOT_BOXER } from './peugeotBoxer'
import { COLORES, getColor, getColorImage } from './colores'

// Registro de modelos (todos los modelos disponibles)
const MODELOS = {
  '208': PEUGEOT_208,
  '2008': PEUGEOT_2008,
  '3008': PEUGEOT_3008,
  '408': PEUGEOT_408,
  '5008': PEUGEOT_5008,
  'partner': PEUGEOT_PARTNER,
  'expert': PEUGEOT_EXPERT,
  'boxer': PEUGEOT_BOXER,
}

/**
 * Obtener modelo por slug
 * @param {string} slug - Slug del modelo (ej: '2008', 'partner')
 * @returns {Object|null} - Objeto modelo o null
 */
export const getModelo = (slug) => {
  if (slug == null || slug === '') return null
  const key = String(slug).trim()
  if (!key) return null
  return MODELOS[key] || MODELOS[key.toLowerCase()] || null
}

/**
 * Verificar si un modelo existe
 * @param {string} slug - Slug del modelo
 * @returns {boolean}
 */
export const existeModelo = (slug) => !!MODELOS[slug]

/**
 * Obtener lista de slugs de modelos disponibles
 * @returns {string[]}
 */
export const getModelosSlugs = () => Object.keys(MODELOS)

/**
 * Obtener todos los modelos como array
 * @returns {Object[]}
 */
export const getAllModelos = () => Object.values(MODELOS)

/**
 * Obtener versión de un modelo
 * @param {string} modeloSlug - Slug del modelo
 * @param {string} versionId - ID de la versión
 * @returns {Object|null}
 */
export const getVersion = (modeloSlug, versionId) => {
  const modelo = getModelo(modeloSlug)
  if (!modelo) return null
  return modelo.versiones.find(v => v.id === versionId) || null
}

/**
 * Obtener colores de una versión específica
 * @param {string} versionId - ID de la versión
 * @returns {Array} - Array de objetos color con data completa
 */
export const getColoresVersion = (versionId) => {
  // Buscar la versión en todos los modelos
  for (const modelo of Object.values(MODELOS)) {
    const version = modelo.versiones.find(v => v.id === versionId)
    if (version) {
      return version.coloresPermitidos
        .map(colorKey => COLORES[colorKey])
        .filter(Boolean)
    }
  }
  return []
}

/**
 * Obtener imagen para una versión y color
 * @param {string} versionId - ID de la versión
 * @param {string} colorKey - Key del color
 * @returns {Object} - { url, alt, hasImage }
 */
export const getImagenVersionColor = (versionId, colorKey) => {
  const color = COLORES[colorKey]
  
  // Buscar la versión para obtener el nombre
  let versionNombre = ''
  for (const modelo of Object.values(MODELOS)) {
    const version = modelo.versiones.find(v => v.id === versionId)
    if (version) {
      versionNombre = version.nombreCorto
      break
    }
  }
  
  if (!color) {
    return { url: null, alt: '', hasImage: false }
  }
  
  return {
    url: color.url,
    alt: `${versionNombre} ${color.label}`,
    hasImage: !!color.url
  }
}

function isNegroColorKey(colorKey) {
  return /negro/i.test(String(colorKey || ''))
}

/** Miniaturas carrusel 0km: 3008 y 5008 mantienen las tomas anteriores (no las del catálogo COLORES). */
const HOME_CERO_KM_CARD_IMAGE_OVERRIDES = {
  '3008': {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1766786949/3008-azul_anat7b.webp',
    alt: 'Peugeot 3008 0km',
  },
  '5008': {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1766786949/5008-azul_sbtpad.png',
    alt: 'Peugeot 5008 0km',
  },
}

/**
 * URL/alt para tarjetas del carrusel 0km (home y /0km): mismas imágenes que el selector de colores en ficha.
 * Excepción: 3008 y 5008 usan imagen fija histórica del sitio (ver HOME_CERO_KM_CARD_IMAGE_OVERRIDES).
 * Usa la primera versión y el color por defecto de esa versión; si el default es negro, elige otro permitido.
 * Sin colores en la versión: imagenPrincipal o heroImage del modelo.
 *
 * @param {Object} modelo - Objeto modelo (PEUGEOT_*)
 * @returns {{ url: string, alt: string } | null}
 */
export function getHomeCeroKmCardImage(modelo) {
  if (!modelo) return null

  const slug = String(modelo.slug || modelo.id || '').trim()
  const override = slug ? HOME_CERO_KM_CARD_IMAGE_OVERRIDES[slug] : null
  if (override) return override

  const version0 = modelo.versiones?.[0]
  const allowed = version0?.coloresPermitidos

  if (allowed?.length) {
    const defaultKey = version0.colorDefault
    let colorKey = defaultKey

    if (!colorKey || !allowed.includes(colorKey)) {
      colorKey = allowed.find((k) => !isNegroColorKey(k)) || allowed[0]
    } else if (isNegroColorKey(defaultKey)) {
      const altKey = allowed.find((k) => !isNegroColorKey(k))
      if (altKey) colorKey = altKey
    }

    const color = COLORES[colorKey]
    if (color?.url) {
      const marca = modelo.marca || 'Peugeot'
      const nombre = modelo.nombre || ''
      return {
        url: color.url,
        alt: `${marca} ${nombre} ${color.label}`.trim(),
      }
    }
  }

  if (modelo.imagenPrincipal?.url) {
    return {
      url: modelo.imagenPrincipal.url,
      alt: modelo.imagenPrincipal.alt || `${modelo.nombre || ''} 0km`.trim(),
    }
  }

  if (modelo.heroImage?.url) {
    return {
      url: modelo.heroImage.url,
      alt: modelo.heroImage.alt || `${modelo.nombre || ''} 0km`.trim(),
    }
  }

  return null
}

// Re-exportar para acceso directo
export {
  PEUGEOT_208,
  PEUGEOT_2008,
  PEUGEOT_3008,
  PEUGEOT_408,
  PEUGEOT_5008,
  PEUGEOT_PARTNER,
  PEUGEOT_EXPERT,
  PEUGEOT_BOXER,
  COLORES,
  getColor,
  getColorImage
}



