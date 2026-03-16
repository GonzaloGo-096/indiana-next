/**
 * peugeot3008.js - Data del modelo Peugeot 3008
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Nuevo formato con equipamiento
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot 3008
 */
export const PEUGEOT_3008 = {
  id: '3008',
  marca: 'Peugeot',
  nombre: '3008',
  slug: '3008',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1773673979/3008-hero-desktop_pzou9c.webp',
    alt: 'Peugeot 3008'
  },
  
  // Galería de imágenes (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-2-mobile_rijtkq.webp', alt: 'Peugeot 3008 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-3-mobile_vkzjvq.webp', alt: 'Peugeot 3008 - Interior i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-4-mobile_am7tlq.webp', alt: 'Peugeot 3008 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-5-mobile_e9r37s.webp', alt: 'Peugeot 3008 - Vista trasera' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-1-desktop_n0vmel.webp', alt: 'Peugeot 3008 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-2-desktop_bappbm.webp', alt: 'Peugeot 3008 - Interior i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-3-desktop_scc9wl.webp', alt: 'Peugeot 3008 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-4-desktop_am8cpv.webp', alt: 'Peugeot 3008 - Vista trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-5-desktop_sbjrxx.webp', alt: 'Peugeot 3008 - Detalles interiores' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/3008-galeria-6-desktop_gnd9ws.webp', alt: 'Peugeot 3008 - Tecnología a bordo' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'gt',
      nombre: 'GT',
      nombreCorto: 'GT',
      descripcion: 'La versión GT es la máxima expresión del nuevo 3008. Cuenta con detalles de diseño únicos y equipamientos exclusivos tanto en el exterior como en el interior, que lo convierten en un verdadero GT.',
      itemsImage: {
        desktop: {
          url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1771948634/3008-gt-desktop_az93s4.webp',
          publicId: '3008-gt-desktop_az93s4'
        },
        mobile: {
          url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1771948612/3008-gt-mobile_w9fqbk.webp',
          publicId: '3008-gt-mobile_w9fqbk'
        }
      },
      coloresPermitidos: [
        '3008-azul-ingaro',
        '3008-gris-titanium', 
        '3008-azul-obsession',
        '3008-gris-artense',
        '3008-negro-perla'
      ],
      colorDefault: '3008-azul-obsession',
      equipamiento: {
        titulo: null, // Sin título, solo lista
        items: [
          'Faros Píxel LED',
          'Parrilla frontal color carrocería',
          'Techo bitono en color negro',
          'Techo panorámico corredizo',
          'Asientos de cuero Alcántara con costura GT',
          'Volante GT con levas de cambio',
          'Peugeot i-Cockpit 3D',
          '9+ ADAS'
        ]
      },
      specs: null, // Sin specs técnicas
      pdf: {
        href: '/pdf/pdf-3008.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    }
  ],
  
  // Sin secciones de características (fotos incorporadas a la galería)
  features: [],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot 3008 GT 0KM | SUV Premium - Colores y Especificaciones',
    description: 'Descubrí el nuevo Peugeot 3008 GT. SUV premium con i-Cockpit 3D, motor turbo y diseño vanguardista. La máxima expresión del 3008.',
    keywords: 'Peugeot 3008, GT, SUV, 0km, premium, i-Cockpit'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_3008.versiones.find(v => v.id === versionId) || null
}

/**
 * Obtener colores de una versión con data completa
 * @param {string} versionId - ID de la versión
 * @returns {Array} - Array de objetos color
 */
export const getColoresVersion = (versionId) => {
  const version = getVersion(versionId)
  if (!version) return []
  
  return version.coloresPermitidos
    .map(colorKey => COLORES[colorKey])
    .filter(Boolean)
}

export default PEUGEOT_3008
