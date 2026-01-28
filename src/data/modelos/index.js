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
export const getModelo = (slug) => MODELOS[slug] || null

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



