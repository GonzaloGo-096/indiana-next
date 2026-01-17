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
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767296132/3008-dk_eiblpq.avif',
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
  
  // Secciones de características destacadas
  features: [
    {
      id: 'i-cockpit-panoramico',
      title: 'NUEVO I-COCKPIT® PANORÁMICO',
      description: 'Revolucioná tu experiencia de conducción con el nuevo i-Cockpit® panorámico de Peugeot.',
      items: [
        'Pantalla panorámica flotante y curva de 21" que se integra perfectamente en el tablero para una ergonomía óptima.',
        'Nuevo volante compacto totalmente equipado con control táctil para una experiencia de conducción óptima y una comodidad incomparable.',
        'Los i-Toggles personalizables te ofrecen acceso rápido a sus 10 funciones favoritas para un manejo intuitivo.'
      ],
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767217559/D_Showroom_3008_7_1_dnumjb.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767217210/D_Showroom_3008_7_1_qcgpji.webp'
      }
    },
    {
      id: 'i-connect-advanced',
      title: 'PEUGEOT I-CONNECT® ADVANCED',
      description: 'El sistema de entretenimiento i-Connect® Advanced con reconocimiento de voz y ergonomía similar a la de un teléfono inteligente te brinda acceso a navegación 3D conectada y actualizaciones "Over The Air".',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767217522/D_Showroom_3008_7_2_eqtm8f.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767217228/D_Showroom_3008_7_2_mys7rj.webp'
      }
    }
  ],
  
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
