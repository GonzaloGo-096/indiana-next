/**
 * peugeotExpert.js - Data del modelo Peugeot Expert
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 3.0.0 - Versión única
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot Expert
 */
export const PEUGEOT_EXPERT = {
  id: 'expert',
  marca: 'Peugeot',
  nombre: 'Expert',
  slug: 'expert',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767294210/portada-expert-dk_j5a2cp.avif',
    alt: 'Peugeot Expert'
  },
  
  // Imagen principal (la misma de la página principal del carrusel)
  imagenPrincipal: {
    publicId: 'expert-blanca_bpowxc',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1766786957/expert-blanca_bpowxc.webp',
    alt: 'Peugeot Expert 0km'
  },
  
  // Galería de imágenes (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767300842/expert-luz-delantera-desktop_-_copia-mobile_evudyd.webp', alt: 'Peugeot Expert - Luz delantera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767300856/expert-rueda-desktop-mobile_by3enz.webp', alt: 'Peugeot Expert - Rueda' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767300868/expert-consola-desktop-mobile_vedvhg.webp', alt: 'Peugeot Expert - Consola' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290202/motorizacion-expert-dk_pqruv7.webp', alt: 'Peugeot Expert - Motorización' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767300701/expert-rueda-desktop-desktop_pb2v7e.webp', alt: 'Peugeot Expert - Rueda' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767300715/expert-consola-desktop-desktop_ilikxw.webp', alt: 'Peugeot Expert - Consola' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289327/expert-asientos-desktop_jb0jja.webp', alt: 'Peugeot Expert - Asientos' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767300778/expert-luz-delantera-desktop_-_copia-desktop_rjic4q.webp', alt: 'Peugeot Expert - Luz delantera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767303191/expert_motor_desk-desktop_kp5yl6.webp', alt: 'Peugeot Expert - Motor' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767303228/ExpertMasthead-desktop_qg1zrl.webp', alt: 'Peugeot Expert - Masthead' }
    ]
  },
  
  // Versiones disponibles
  versiones: [
    {
      id: 'l3-hdi-120-mixto',
      nombre: 'L3 HDI 120 - Mixto',
      nombreCorto: 'L3 HDI 120 - Mixto',
      descripcion: 'Ingresa al mundo utilitario con Expert, con un gran nivel de equipamiento.',
      coloresPermitidos: [], // Sin colores
      colorDefault: null,
      equipamiento: {
        titulo: '',
        items: [
          'Motorización 2.2L HDI de 150cv',
          'Capacidad de carga 4 m³/1285Kg',
          '3 plazas para pasajeros en fila 2',
          'Cristales en fila 2',
          'Pantalla Multimedia 5 pulgadas',
          'Doble Airbag'
        ]
      },
      specs: null,
      pdf: {
        href: '/pdf/pdf-expert.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'l3-hdi-120-carga',
      nombre: 'L3 HDI 120 - Carga',
      nombreCorto: 'L3 HDI 120 - Carga',
      descripcion: 'Ingresa al mundo utilitario con Expert, con un gran nivel de equipamiento.',
      coloresPermitidos: [], // Sin colores
      colorDefault: null,
      equipamiento: {
        titulo: '',
        items: [
          'Capacidad de carga de 6,1 m³/1450Kg',
          '3 plazas delanteras',
          'Pantalla Multimedia 5 pulgadas',
          'Doble Airbag',
          'Dirección asistida Eléctrica',
          'Motorización 1.5L HDI de 120cv'
        ]
      },
      specs: null,
      pdf: {
        href: '/pdf/pdf-expert.pdf',
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
      id: 'mayor-eficiencia',
      title: 'MAYOR EFICIENCIA',
      description: 'Una arquitectura de última generación que conjuga un tamaño ideal y se adapta a todas las necesidades con una capacidad de carga.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290234/confort3dk_am1dqv.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289203/confort3dk_rbmyii.webp'
      }
    },
    {
      id: 'con-nuevas-exigencias',
      title: 'CON NUEVAS EXIGENCIAS',
      description: 'El rediseño de Peugeot Expert lo convirtió en el integrante  más moderno de la gama de vehículos utilitarios, definiendo la nueva medida de trabajo para los profesionales actuales. Además de un restyling exterior, para adecuarla a la nueva imagen de la marca, se mejoró la eficiencia, la seguridad y modularidad.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290248/confort1dk_mieky2.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289212/confort1dk_oruvxc.webp'
      }
    }
  ],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot Expert 0KM | Furgón Profesional',
    description: 'Descubrí el nuevo Peugeot Expert. Furgón profesional con capacidad de 1200 kg y 5.3 m³.',
    keywords: 'Peugeot Expert, furgón, profesional, 0km, utilitario'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_EXPERT.versiones.find(v => v.id === versionId) || null
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

export default PEUGEOT_EXPERT
