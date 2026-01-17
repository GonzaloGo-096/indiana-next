/**
 * peugeotBoxer.js - Data del modelo Peugeot Boxer
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 4.0.0 - 2 versiones: L2H2 HDI140 y L3H2 HDI140
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot Boxer
 */
export const PEUGEOT_BOXER = {
  id: 'boxer',
  marca: 'Peugeot',
  nombre: 'Boxer',
  slug: 'boxer',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767294271/hero-boxer_lzzopv.avif',
    alt: 'Peugeot Boxer'
  },
  
  // Imagen principal (la misma de la página principal del carrusel)
  imagenPrincipal: {
    publicId: 'boxer-blanca_zsb84z',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1766786948/boxer-blanca_zsb84z.webp',
    alt: 'Peugeot Boxer 0km'
  },
  
  // Galería de imágenes (fija por modelo, no por versión)
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290073/boxer-3-dk2_rg9ea1.webp', alt: 'Peugeot Boxer - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290042/galeria-boxer-1_yffl7k.webp', alt: 'Peugeot Boxer - Galería 1' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290062/boxer-2-dk3_bjozaq.webp', alt: 'Peugeot Boxer - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767293985/optimiza-costos_mvivhr.webp', alt: 'Peugeot Boxer - Optimiza costos' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289547/galeria-boxer-1_repx16.webp', alt: 'Peugeot Boxer - Galería 1' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767291190/optimiza-costos_qn2ev3.webp', alt: 'Peugeot Boxer - Optimiza costos' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289495/boxer-2-dk3_dpfjfd.webp', alt: 'Peugeot Boxer - Detalle frontal' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289516/boxer-3-dk2_tr16rk.webp', alt: 'Peugeot Boxer - Vista exterior' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767303071/BoxerNegocio-desktop_wowvbi.webp', alt: 'Peugeot Boxer - Negocio' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767303106/WhatsApp-Image-2025-09-01-at-15.00.38_1_-desktop_vcjvpl.webp', alt: 'Peugeot Boxer - Detalle' }
    ]
  },
  
  // Versiones disponibles - 2 versiones
  versiones: [
    {
      id: 'l2h2-hdi140',
      nombre: 'L2H2 HDI140',
      nombreCorto: 'L2H2 HDI140',
      descripcion: 'Boxer, es el vehículo utilitario de la marca de mayor capacidad, robusto, económico y adaptable a tu negocio. Diseñado y equipado para responder de manera duradera a las exigencias de los profesionales.',
      coloresPermitidos: [], // Sin colores
      colorDefault: null,
      specs: {
        carga: 'Capacidad 1500 kg',
        volumen: '10 m³',
        motor: 'HDi 2.2L 140cv',
        caja: 'Manual 6 velocidades',
        puertas: 'Traseras 180°',
        consumo: '8.5 L/100km'
      },
      pdf: {
        href: '/pdf/pdf-boxer.pdf',
        label: 'Ficha Técnica',
        fileSize: null,
        variant: 'outline',
        size: 'medium'
      }
    },
    {
      id: 'l3h2-hdi140',
      nombre: 'L3H2 HDI140',
      nombreCorto: 'L3H2 HDI140',
      descripcion: 'Boxer, es el vehículo utilitario de la marca de mayor capacidad, robusto, económico y adaptable a tu negocio.',
      coloresPermitidos: [], // Sin colores
      colorDefault: null,
      specs: {
        carga: 'Capacidad 1800 kg',
        volumen: '13 m³',
        motor: 'HDi 2.2L 140cv',
        caja: 'Manual 6 velocidades',
        puertas: 'Laterales corredizas + traseras 180°',
        consumo: '9.0 L/100km'
      },
      pdf: {
        href: '/pdf/pdf-boxer.pdf',
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
      id: 'ideal-para-tu-negocio',
      title: 'IDEAL PARA TU NEGOCIO',
      description: 'Más que un medio de transporte, la nueva Peugeot Boxer es una herramienta al servicio de la eficacia. Destaca su trayectoria desde hace más de 20 años mantieneniendo todo aquello que la convirtió en un éxito. Esta nueva versión de Peugeot Boxer se destaca por su calidad, seguridad y confort.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290062/boxer-2-dk3_bjozaq.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289495/boxer-2-dk3_dpfjfd.webp'
      }
    },
    {
      id: 'boxer-es-revolvuion',
      title: 'BOXER ES revolvuion',
      description: 'La nueva Peugeot Boxer representa una evolución en todos los aspectos que caracterizan a los vehículos comerciales de la marca avalados en su amplia trayectoria.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767290073/boxer-3-dk2_rg9ea1.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1767289516/boxer-3-dk2_tr16rk.webp'
      }
    }
  ],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot Boxer 0KM | L2H2 HDI140 y L3H2 HDI140',
    description: 'Descubrí el nuevo Peugeot Boxer. Vehículo utilitario de mayor capacidad, robusto y económico. Versiones L2H2 HDI140 y L3H2 HDI140.',
    keywords: 'Peugeot Boxer, furgón grande, 0km, utilitario, carga, L2H2, L3H2, HDI140'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_BOXER.versiones.find(v => v.id === versionId) || null
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

export default PEUGEOT_BOXER
