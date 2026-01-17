/**
 * peugeot2008.js - Data del modelo Peugeot 2008
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Nuevo formato con equipamiento
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot 2008
 */
export const PEUGEOT_2008 = {
  id: '2008',
  marca: 'Peugeot',
  nombre: '2008',
  slug: '2008',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767293998/kv-2008-dk-13102025_loyq4t.avif',
    alt: 'Peugeot 2008'
  },
  
  // Galería de imágenes (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-1-mobile_xf79qs.webp', alt: 'Peugeot 2008 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-2-mobile_d8xwmz.webp', alt: 'Peugeot 2008 - Interior i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-3-mobile_ykqd6u.webp', alt: 'Peugeot 2008 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-4-mobile_dqf5zf.webp', alt: 'Peugeot 2008 - Vista trasera' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-1-desktop_cljotq.webp', alt: 'Peugeot 2008 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-2-desktop_gp3ruh.webp', alt: 'Peugeot 2008 - Interior i-Cockpit' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-3-desktop_dxvyqd.webp', alt: 'Peugeot 2008 - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-4-desktop_c7yoxt.webp', alt: 'Peugeot 2008 - Vista trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-5-desktop_g0mych.webp', alt: 'Peugeot 2008 - Detalles interiores' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/2008-galeria-6-desktop_drukj6.webp', alt: 'Peugeot 2008 - Tecnología a bordo' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'active',
      nombre: 'ACTIVE',
      nombreCorto: 'ACTIVE',
      descripcion: 'Ingresá al mundo 2008 con la versión ACTIVE, con un gran nivel de equipamiento.',
      coloresPermitidos: ['blanco-nacre', 'gris-artense', 'negro', 'gris-selenium'],
      colorDefault: 'blanco-nacre',
      equipamiento: {
        titulo: 'Con equipamiento:',
        items: [
          'Faros ECO-LED',
          'Faros DRL LED exclusivos de 3 garras',
          'Llantas 17" diamantadas',
          'Peugeot i-Cockpit con multimedia de 10"',
          'Display de conductor digital 2D',
          'Freno de mano eléctrico'
        ]
      },
      specs: null, // Sin specs técnicas
      pdf: {
        href: '/pdf/pdf-2008.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'allure',
      nombre: 'ALLURE',
      nombreCorto: 'ALLURE',
      descripcion: 'La versión Allure se destaca por su elevado nivel de equipamiento de tecnología, confort y seguridad.',
      coloresPermitidos: ['blanco-nacre', 'gris-artense', 'negro', 'gris-selenium'],
      colorDefault: 'gris-selenium',
      equipamiento: {
        titulo: 'Además del equipamiento de la versión Active, agrega:',
        items: [
          'Airbags de cortina',
          'Ayudas a la conducción',
          'Cámara 360º y sensores de estacionamiento delanteros',
          'Acceso y arranque manos libres',
          'Cargador inductivo de celular, de 15W'
        ]
      },
      specs: null, // Sin specs técnicas
      pdf: {
        href: '/pdf/pdf-2008.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'gt',
      nombre: 'GT',
      nombreCorto: 'GT',
      descripcion: 'La versión GT es la máxima expresión del nuevo Peugeot 2008. Cuenta con destalles de diseño únicos y equipamientos exclusivos tanto en el exterior como en el interior, que lo convierten en un verdadero GT.',
      coloresPermitidos: ['negro', 'gris-selenium', 'blanco-nacre'],
      colorDefault: 'negro',
      equipamiento: {
        titulo: 'Además del equipamiento Allure:',
        items: [
          'Faros Full LED',
          'Parrilla frontal color carrocería',
          'Techo bitono en color negro',
          'Techo panorámico corredizo',
          'Asientos de cuero con costura GT',
          'Volante GT con levas de cambio',
          'Peugeot i-Cockpit 3D'
        ]
      },
      specs: null, // Sin specs técnicas
      pdf: {
        href: '/pdf/pdf-2008.pdf',
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
      id: 'conectividad-avanzada',
      title: 'CONECTIVIDAD AVANZADA',
      description: 'Una nueva pantalla multimedia de 10", que cuenta con una gran definición y fluidez, además de conexión inalámbrica para para espejar las funciones del celular como música o navegación.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767212686/excelencia2-dk_nvbjlk.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767212621/excelencia2-dk_i58rib.webp'
      }
    },
    {
      id: 'realidad-aumentada',
      title: 'REALIDAD AUMENTADA 3D',
      description: 'Escaneá el QR y conocé de una manera distinta el 2008 a través de la realidad aumentada / 3D.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767212011/2008car6_tpics6.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767212039/laion-ra-4_yrpunt.webp'
      }
    }
  ],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot 2008 0KM | Versiones, Colores y Especificaciones',
    description: 'Descubrí el nuevo Peugeot 2008. Motor PureTech 130cv, i-Cockpit 3D y diseño SUV. Versiones Active, Allure y GT disponibles.',
    keywords: 'Peugeot 2008, SUV, 0km, PureTech, i-Cockpit'
  },

  // PDF opcional para descarga (ficha técnica, catálogo, etc.)
  // El archivo debe estar en /public/pdf/
  // Ejemplo:
  // pdf: {
  //   href: '/pdf/peugeot-2008-ficha-tecnica.pdf',
  //   label: 'Descargar Ficha Técnica',
  //   fileSize: '1,2 MB',
  //   openInNewTab: false, // Si true, abre en nueva pestaña en lugar de descargar
  //   variant: 'primary', // 'primary' | 'secondary' | 'outline'
  //   size: 'medium' // 'small' | 'medium' | 'large'
  // }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_2008.versiones.find(v => v.id === versionId) || null
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
    .filter(Boolean) // Filtrar colores que no existan
}

/**
 * Obtener imagen para una versión y color
 * @param {string} versionId - ID de la versión
 * @param {string} colorKey - Key del color
 * @returns {Object} - { url, alt, hasImage }
 */
export const getImagenVersionColor = (versionId, colorKey) => {
  const version = getVersion(versionId)
  const color = COLORES[colorKey]
  
  if (!version || !color) {
    return { url: null, alt: '', hasImage: false }
  }
  
  // Por ahora, todos los colores usan la misma estructura de URL
  // En el futuro se puede customizar por versión
  return {
    url: color.url,
    alt: `Peugeot 2008 ${version.nombreCorto} ${color.label}`,
    hasImage: !!color.url
  }
}

export default PEUGEOT_2008
