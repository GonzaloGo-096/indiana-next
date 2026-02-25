/**
 * peugeot408.js - Data del modelo Peugeot 408
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 3.0.0 - Nuevo formato con equipamiento
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot 408
 */
export const PEUGEOT_408 = {
  id: '408',
  marca: 'Peugeot',
  nombre: '408',
  slug: '408',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767294182/408-portada-dk_tk8367.avif',
    alt: 'Peugeot 408'
  },
  
  // Galería: posición 1 = i-Cockpit, posición 3 = i-Connect Advanced (reemplazo, no suma)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216291/408-emocion-2-dk_x3ltsh.webp', alt: 'Peugeot 408 - Nuevo Peugeot i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-3-mobile_flepzo.webp', alt: 'Peugeot 408 - Interior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216275/408-emocion-1-dk_bsafuu.webp', alt: 'Peugeot 408 - Peugeot i-Connect Advanced' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-5-mobile_srnsqt.webp', alt: 'Peugeot 408 - Vista trasera' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216241/408-emocion-2-dk_x6zv6y.webp', alt: 'Peugeot 408 - Nuevo Peugeot i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-2-desktop_a1fsgw.webp', alt: 'Peugeot 408 - Interior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216225/408-emocion-1-dk_uiatzj.webp', alt: 'Peugeot 408 - Peugeot i-Connect Advanced' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-3-desktop_wo7lyj.webp', alt: 'Peugeot 408 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-4-desktop_eswlmd.webp', alt: 'Peugeot 408 - Vista trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-5-desktop_jqaay6.webp', alt: 'Peugeot 408 - Detalles interiores' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'gt',
      nombre: 'GT',
      nombreCorto: 'GT',
      descripcion: 'La versión GT es la máxima expresión del nuevo 408. Cuenta con detalles de diseño únicos y equipamientos exclusivos tanto en el exterior como en el interior, que lo convierten en un verdadero GT.',
      itemsImage: {
        desktop: {
          url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1771948763/4008-gt_mwucs6.webp',
          publicId: '4008-gt_mwucs6'
        },
        mobile: {
          url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1771948812/408-gt-mobile_wk58gq.webp',
          publicId: '408-gt-mobile_wk58gq'
        }
      },
      coloresPermitidos: [
        '408-blanco-okenite',
        '408-azul-obsession',
        '408-negro-perla',
        '408-gris-selenium'
      ],
      colorDefault: '408-gris-selenium',
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
        href: '/pdf/pdf-408.pdf',
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
    title: 'Peugeot 408 GT 0KM | Fastback Premium',
    description: 'Descubrí el nuevo Peugeot 408 GT. Diseño fastback único, i-Cockpit 3D y equipamiento exclusivo. La máxima expresión del 408.',
    keywords: 'Peugeot 408, GT, fastback, 0km, premium, i-Cockpit'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_408.versiones.find(v => v.id === versionId) || null
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

export default PEUGEOT_408

