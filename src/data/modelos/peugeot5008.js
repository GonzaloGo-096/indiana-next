/**
 * peugeot5008.js - Data del modelo Peugeot 5008
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Galería completa actualizada
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot 5008
 */
export const PEUGEOT_5008 = {
  id: '5008',
  marca: 'Peugeot',
  nombre: '5008',
  slug: '5008',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767295001/banner-principal-peugeot-5008-2880x1235_vlawib.avif',
    alt: 'Peugeot 5008'
  },
  
  // Galería de imágenes (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-2-mobile_jd8oaz.webp', alt: 'Peugeot 5008 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-3-mobile_zks3te.webp', alt: 'Peugeot 5008 - Interior 7 plazas' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-4-mobile_iokfwz.webp', alt: 'Peugeot 5008 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-5-mobile_l2oykf.webp', alt: 'Peugeot 5008 - Vista trasera' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-1-desktop_ozrqvi.webp', alt: 'Peugeot 5008 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-4-desktop_h3tcku.webp', alt: 'Peugeot 5008 - Vista trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-3-desktop_lrel2f.webp', alt: 'Peugeot 5008 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-6-desktop_qvuuu8.webp', alt: 'Peugeot 5008 - Tecnología a bordo' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-5-desktop_u9kgbu.webp', alt: 'Peugeot 5008 - Tercera fila de asientos' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/5008-galeria-2-desktop_l17ynv.webp', alt: 'Peugeot 5008 - Interior 7 plazas' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'gt',
      nombre: 'GT',
      nombreCorto: 'GT',
      descripcion: 'La versión GT es la máxima expresión del nuevo 5008. Cuenta con detalles de diseño únicos y equipamientos exclusivos tanto en el exterior como en el interior, que lo convierten en un verdadero GT.',
      coloresPermitidos: [
        '5008-blanco-okenite',
        '5008-azul-ingaro',
        '5008-negro-perla',
        '5008-gris-artense',
        '5008-azul-obsession',
        '5008-gris-titanium'
      ],
      colorDefault: '5008-azul-obsession',
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
        href: '/pdf/pdf-5008.pdf',
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
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767214427/d8_hlprgn.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767213846/d8_p6ze72.webp'
      }
    },
    {
      id: '7-plazas',
      title: '7 PLAZAS',
      description: 'El nuevo 5008 ofrece 7 plazas para mayor comodidad y flexibilidad en tus viajes, disfrutá del espacio y confort en cada trayecto.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767214411/7-plazas-1dk_akauw6.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767213862/7-plazas-1dk_ybqpmg.webp'
      }
    }
  ],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot 5008 GT 0KM | SUV 7 Plazas Premium',
    description: 'Descubrí el nuevo Peugeot 5008 GT. SUV familiar de 7 plazas con i-Cockpit, diseño exclusivo y máximo confort. La máxima expresión del 5008.',
    keywords: 'Peugeot 5008, GT, SUV, 7 plazas, 0km, familiar, premium'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_5008.versiones.find(v => v.id === versionId) || null
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

export default PEUGEOT_5008
