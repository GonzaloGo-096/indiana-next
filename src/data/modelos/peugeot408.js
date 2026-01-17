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
  
  // Galería de imágenes (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-2-mobile_lddxv4.webp', alt: 'Peugeot 408 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-3-mobile_flepzo.webp', alt: 'Peugeot 408 - Interior i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-4-mobile_zhqnov.webp', alt: 'Peugeot 408 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-5-mobile_srnsqt.webp', alt: 'Peugeot 408 - Vista trasera' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-1-desktop_obmjrm.webp', alt: 'Peugeot 408 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-2-desktop_a1fsgw.webp', alt: 'Peugeot 408 - Interior i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-3-desktop_wo7lyj.webp', alt: 'Peugeot 408 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-4-desktop_eswlmd.webp', alt: 'Peugeot 408 - Vista trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-5-desktop_jqaay6.webp', alt: 'Peugeot 408 - Detalles interiores' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/408-galeria-6-desktop_rubyvw.webp', alt: 'Peugeot 408 - Tecnología a bordo' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'gt',
      nombre: 'GT',
      nombreCorto: 'GT',
      descripcion: 'La versión GT es la máxima expresión del nuevo 408. Cuenta con detalles de diseño únicos y equipamientos exclusivos tanto en el exterior como en el interior, que lo convierten en un verdadero GT.',
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
  
  // Secciones de características destacadas
  features: [
    {
      id: 'i-cockpit',
      title: 'NUEVO PEUGEOT I-COCKPIT®',
      description: 'Viví tu experiencia de conducción al máximo con el nuevo Peugeot i-Cockpit®.',
      items: [
        'Pantalla multimedia táctil de 10".',
        'Volante compacto con control táctil para optimizar y facilitar el acceso a funciones.',
        'Los i-Toggles táctiles personalizables y configurables te ofrecen acceso rápido a sus funciones favoritas para un manejo intuitivo.'
      ],
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216291/408-emocion-2-dk_x3ltsh.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216241/408-emocion-2-dk_x6zv6y.webp'
      }
    },
    {
      id: 'i-connect-advanced',
      title: 'PEUGEOT I-CONNECT® ADVANCED',
      description: 'El sistema de entretenimiento i-Connect® Advanced con reconocimiento de voz y ergonomía similar a la de un teléfono inteligente te brinda acceso a navegación conectada.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216275/408-emocion-1-dk_bsafuu.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767216225/408-emocion-1-dk_uiatzj.webp'
      }
    }
  ],
  
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

