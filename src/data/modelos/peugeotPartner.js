/**
 * peugeotPartner.js - Data del modelo Peugeot Partner
 * 
 * Contiene toda la información del modelo: versiones, colores permitidos,
 * specs, descripciones y galería de imágenes.
 * La UI consume esta data sin conocer strings mágicos.
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Contenido actualizado: Partner Confort 1.6 y 1.6 HDI 92
 */

import { COLORES } from './colores'

/**
 * Configuración del modelo Peugeot Partner
 */
export const PEUGEOT_PARTNER = {
  id: 'partner',
  marca: 'Peugeot',
  nombre: 'Partner',
  slug: 'partner',
  año: 2024,
  
  // Hero image (solo desktop)
  heroImage: {
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782324100/hero-partner_m2mitq.webp',
    alt: 'Peugeot Partner'
  },
  
  // Imagen principal (la #2 del carrusel: vista lateral, se ve mejor de costado en
  // las miniaturas del home y del listado /0km). En la ficha del modelo igual se
  // sigue mostrando partner-7 (frente) primero porque el MainImageCarousel usa
  // imagenesPrincipales, no este campo.
  imagenPrincipal: {
    publicId: 'partner-4_wmkis3',
    url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782324020/partner-4_wmkis3.webp',
    alt: 'Peugeot Partner 0km'
  },

  // Carrusel principal en la ficha (reemplaza a la foto fija cuando el modelo no tiene colores)
  // Cada elemento provee url específica para mobile y desktop.
  imagenesPrincipales: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782325052/partner-7_gdw1ov.webp', alt: 'Peugeot Partner - Frente' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782323505/partner-4_dsgrvc.webp', alt: 'Peugeot Partner - Lateral' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782325058/partner-10_tbjjnv.webp', alt: 'Peugeot Partner - Trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782325055/partner-9_vj7cst.webp', alt: 'Peugeot Partner - Zona de carga' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782324979/partner-7_orroib.webp', alt: 'Peugeot Partner - Frente' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782324020/partner-4_wmkis3.webp', alt: 'Peugeot Partner - Lateral' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782324969/partner-11_ud6drc.webp', alt: 'Peugeot Partner - Trasera' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782324969/partner-9_ygkjvn.webp', alt: 'Peugeot Partner - Zona de carga' }
    ]
  },
  
  // Galería de imágenes (fija por modelo, no por versión)
  // 4 fotos en mobile y desktop: las mismas del carrusel principal.
  // Mobile: 2 cols × 2 filas. Desktop: 2 cols × 2 filas (el CSS detecta 4 fotos
  // y cambia el grid de 3 cols a 2 cols para no dejar una huérfana).
  galeria: {
    mobile: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405629/galeria-1_l8215o.webp', alt: 'Peugeot Partner - Galería 1' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405629/galeria-5_lpmbbj.webp', alt: 'Peugeot Partner - Galería 2' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405628/galeria-3_ufmoox.webp', alt: 'Peugeot Partner - Galería 3' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405627/galeria-4_wjxy24.webp', alt: 'Peugeot Partner - Galería 4' }
    ],
    desktop: [
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405609/galeria-1_fhry84.webp', alt: 'Peugeot Partner - Galería 1' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405608/galeria-4_wmu798.webp', alt: 'Peugeot Partner - Galería 2' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405608/galeria-2_kt2jhc.webp', alt: 'Peugeot Partner - Galería 3' },
      { url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782405608/galeria-5_vrie6r.webp', alt: 'Peugeot Partner - Galería 4' }
    ]
  },
  
  // Versiones disponibles - Una sola versión
  // itemsImage: foto con los beneficios/equipamiento embebidos como badges. Mismo
  // patrón que usan 208/2008/3008/etc. En desktop la renderiza VersionItemsImageDesktop
  // (full-bleed debajo del carrusel); en mobile se renderiza dentro del mobileContainer
  // al final, también full-width.
  versiones: [
    {
      id: 'confort-van-l2-hdi-92-am26',
      nombre: 'CONFORT VAN L2 HDI 92 AM26',
      nombreCorto: 'CONFORT VAN L2 HDI 92 AM26',
      descripcion: null,
      itemsImage: {
        desktop: {
          url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782323210/partner-6_sfmv56.webp',
          publicId: 'partner-6_sfmv56'
        },
        mobile: {
          url: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782325050/partner-6_szc2bw.webp',
          publicId: 'partner-6_szc2bw'
        }
      },
      coloresPermitidos: [],
      colorDefault: null,
      equipamiento: { titulo: '', items: [] },
      specs: null,
      pdf: {
        href: '/pdf/pdf-partner.pdf',
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
      id: 'modularidad',
      title: 'MODULARIDAD QUE SE ADAPTA A VOS',
      description: 'Modernidad significa adaptabilidad. Configurá tu espacio de trabajo según tus necesidades del día. El espacio de carga ofrece 3,9m³ y una capacidad de carga de 865 kg.',
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782325048/partner-5_eaofzj.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782323209/partner-5_tzxsxb.webp'
      }
    },
    {
      id: 'i-cockpit',
      title: 'I-COCKPIT® OPTIMIZADO',
      description: `Su volante ágil y compacto con nuevos mandos para facilitar la conducción, una pantalla táctil de 10'' y un cuadro de instrumentos 100% digital de 10'' hacen que la conducción sea más segura e intuitiva.`,
      images: {
        mobile: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782325045/partner-3_jepzuc.webp',
        desktop: 'https://res.cloudinary.com/drbeomhcu/image/upload/v1782323210/partner-3_zskqmc.webp'
      }
    }
  ],
  
  // Configuración SEO
  seo: {
    title: 'Peugeot Partner 0KM | Confort Van L2 HDI 92 AM26',
    description: 'Descubrí el nuevo Peugeot Partner Confort Van L2 HDI 92 AM26. Utilitario versátil para trabajo, motor diésel HDI de 92 CV y 865 kg de capacidad de carga.',
    keywords: 'Peugeot Partner, Confort Van, L2 HDI 92, AM26, furgón, utilitario, 0km'
  }
}

/**
 * Obtener versión por ID
 * @param {string} versionId - ID de la versión
 * @returns {Object|null} - Objeto versión o null
 */
export const getVersion = (versionId) => {
  return PEUGEOT_PARTNER.versiones.find(v => v.id === versionId) || null
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

export default PEUGEOT_PARTNER
