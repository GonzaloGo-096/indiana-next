/**
 * peugeot208.js - Data del modelo Peugeot 208
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 2.0.1 - Data real del 208
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot 208
 */
export const PEUGEOT_208 = {
  id: '208',
  marca: 'Peugeot',
  nombre: '208',
  slug: '208',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767294089/kv-208-dk-14102025_lgr8iu.avif',
    alt: 'Peugeot 208'
  },
  
  // Galería de imágenes del carrusel (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767130968/ec5dk.jpg_prsxiy.webp', alt: 'Peugeot 208 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767205148/galeria-208-andando-desktop_ipofof.webp', alt: 'Peugeot 208 - En movimiento' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767205160/galeria-208-frente-desktop_ckq7kc.webp', alt: 'Peugeot 208 - Vista frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767205172/galeria-208-luz-desktop_md7ufy.webp', alt: 'Peugeot 208 - Detalle de luces' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767204844/ec5dk.jpg_cjrtaq.webp', alt: 'Peugeot 208 - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767204832/galeria-208-luztrasera-desktop_m7sbla.webp', alt: 'Peugeot 208 - Luz trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767204821/galeria-208-andando-desktop_nusjrq.webp', alt: 'Peugeot 208 - En movimiento' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767204809/galeria-208-andando2-desktop_cqltfe.webp', alt: 'Peugeot 208 - En movimiento 2' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767204800/galeria-208-rueda-desktop_uubqtq.webp', alt: 'Peugeot 208 - Detalle de rueda' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767205088/galeria-208-frente-desktop_n8epf6.webp', alt: 'Peugeot 208 - Vista frontal' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'active',
      nombre: 'ACTIVE',
      nombreCorto: 'ACTIVE',
      descripcion: 'Entrá en el universo PEUGEOT con la versión Active, que se destaca por su equilibrio entre rendimiento y eficiencia.',
      coloresPermitidos: ['208-blanco-nacre', '208-gris-artense', '208-negro-perla'],
      colorDefault: '208-blanco-nacre',
      equipamiento: {
        titulo: 'Con equipamiento:',
        items: [
          '4 airbags',
          'Faros halógenos',
          'Llantas 15" con cobertor',
          'Espejos negro brillante',
          'Faros LED traseros',
          'PEUGEOT i-Cockpit con tablero analógico'
        ]
      },
      specs: null,
      pdf: {
        href: '/pdf/pdf-208.pdf',
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
      descripcion: 'La versión Allure cuenta con un gran nivel de equipamiento que lo convierte en un vehículo completo.',
      coloresPermitidos: ['208-blanco-nacre', '208-gris-artense', '208-negro-perla'],
      colorDefault: '208-gris-artense',
      equipamiento: {
        titulo: 'Con equipamiento:',
        items: [
          'Nuevos faros DRL TRI LED',
          'Parrilla delantera en negro brillante',
          'Llantas 16" de aleación',
          'PEUGEOT i-Cockpit con display conductor digital 2D',
          'Pantalla multimedia de 10"',
          'Climatizador automático',
          'Cámara y sensores traseros de estacionamiento'
        ]
      },
      specs: null,
      pdf: {
        href: '/pdf/pdf-208.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'allure-pk',
      nombre: 'ALLURE PK',
      nombreCorto: 'ALLURE PK',
      descripcion: 'La versión Allure Pk se destaca por su elevado nivel de confort y tecnología.',
      coloresPermitidos: ['208-blanco-nacre', '208-gris-artense', '208-negro-perla'],
      colorDefault: '208-blanco-nacre',
      equipamiento: {
        titulo: 'Con equipamiento:',
        items: [
          '6 airbags',
          'Llantas 16" diamantadas',
          'Techo panorámico cielo',
          'Asientos en tela y cuero',
          'Nuevo cargador inductivo de celular'
        ]
      },
      specs: null,
      pdf: {
        href: '/pdf/pdf-208.pdf',
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
      descripcion: 'La versión GT es la nueva máxima expresión del Peugeot 208. Cuenta con detalles estéticos únicos, tecnología de punta, máxima seguridad posible y la identidad visual de un verdadero GT.',
      coloresPermitidos: ['208-negro-perla', '208-blanco-nacre', '208-gris-artense'],
      colorDefault: '208-negro-perla',
      equipamiento: {
        titulo: 'Con equipamiento:',
        items: [
          'Parrilla color carrocería',
          'Faros Full LED',
          'Llantas 17" diamantadas y pasaruedas en negro brillante',
          'Alerón trasero y salida de escape cromada',
          'Interior con costuras verdes GT',
          'Volante con insignia GT',
          'PEUGEOT i-Cockpit 3D',
          'Paquete de Ayudas a la Conducción'
        ]
      },
      specs: null,
      pdf: {
        href: '/pdf/pdf-208.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'allure-pk-t200',
      nombre: 'ALLURE PK T200',
      nombreCorto: 'ALLURE PK T200',
      descripcion: 'La versión Allure Pk es la mejor expresión de equipamiento y performance con detalles de confort únicos.',
      coloresPermitidos: ['208-blanco-nacre', '208-gris-artense', '208-negro-perla'],
      colorDefault: '208-negro-perla',
      equipamiento: null,
      specs: null,
      pdf: {
        href: '/pdf/pdf-208.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'allure-at',
      nombre: 'ALLURE AT',
      nombreCorto: 'ALLURE AT',
      descripcion: 'La versión Allure cuenta con un gran nivel de equipamiento de serie que lo vuelve un vehículo muy completo.',
      coloresPermitidos: ['208-blanco-nacre', '208-gris-artense', '208-negro-perla'],
      colorDefault: '208-blanco-nacre',
      equipamiento: null,
      specs: null,
      pdf: {
        href: '/pdf/pdf-208.pdf',
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
      id: 'display-conductor',
      title: 'DISPLAY DE CONDUCTOR',
      description: 'Obtené información clave de conducción en un instante con el panel de instrumentos digital configurable, disponible como pantalla 2D o 3D.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/208n5.webp_pbbxu3.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/excelencia1dk2_anz3an.webp'
      }
    },
    {
      id: 'realidad-aumentada',
      title: 'REALIDAD AUMENTADA 3D',
      description: 'Escaneá el QR y conocé de una manera distinta el 208 a través de la realidad aumentada / 3D.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/ec5dk.jpg_prsxiy.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/laion-ra-208-dk2_enmble.webp'
      }
    }
  ],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot 208 0KM | Versiones, Colores y Especificaciones',
    description: 'Descubrí el nuevo Peugeot 208. Diseño moderno, tecnología i-Cockpit y eficiencia. Versiones Active, Allure, Allure PK, GT, Allure PK T200 y Allure AT disponibles.',
    keywords: 'Peugeot 208, hatchback, 0km, i-Cockpit, GT'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_208.versiones.find(v => v.id === versionId) || null
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

export default PEUGEOT_208
