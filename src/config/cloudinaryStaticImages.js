/**
 * cloudinaryStaticImages.js - URLs centralizadas de imágenes estáticas en Cloudinary
 * 
 * Este módulo centraliza TODAS las imágenes estáticas del sitio.
 * NO genera URLs dinámicas, NO aplica transformaciones.
 * 
 * Estructura:
 * - home: Hero de página principal
 * - nav: Logo de navegación
 * - usados: Placeholder para vehículos
 * - postventa: Hero y servicios
 * - ceroKm: Modelos 0km
 * - footer: (reservado)
 * 
 * @author Indiana Usados
 * @version 2.0.0 - Agregado ceroKm
 */

export const staticImages = {
  home: {
    heroDesktop: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766081803/indiana-hero-1-desktop_simhmy.webp",
      alt: "Vehículos de calidad en Indiana Usados",
    },
    heroMobile: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766081806/indiana-hero-1-mobile_bjl5pz.webp",
      alt: "Vehículos de calidad en Indiana Usados",
    },
  },

  nav: {
    logo: {
      src: "/assets/logos/logos-indiana/indiana-final.webp",
      alt: "Logo Indiana",
    },
  },

  usados: {
    placeholder: {
      src: "/assets/logos/logos-indiana/desktop/logo-chico-solid.webp",
      alt: "Imagen predeterminada del vehículo",
    },
  },

  postventa: {
    hero: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766082648/hero-postventa_imjehq.webp",
      alt: "Servicio de postventa Indiana",
    },
    services: {
      taller: {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766082651/service-taller_tspvge.webp",
        alt: "Servicio de taller",
      },
      repuestos: {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766082650/service-repuestos_yzjfyg.webp",
        alt: "Repuestos originales",
      },
      chapa: {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766082649/service-chapa_rhksxk.webp",
        alt: "Chapa y pintura",
      },
    },
  },

  ceroKm: {
    modelos: {
      "208": {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786931/208-blanco_au72bz.webp",
        alt: "Peugeot 208 0km",
        titulo: "208",
      },
      "2008": {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786948/2008-negro_utp7gx.webp",
        alt: "Peugeot 2008 0km",
        titulo: "2008",
      },
      "3008": {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786949/3008-azul_anat7b.webp",
        alt: "Peugeot 3008 0km",
        titulo: "3008",
      },
      "408": {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1767024250/408-gris_fsi73k.webp",
        alt: "Peugeot 408 0km",
        titulo: "408",
      },
      "5008": {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786949/5008-azul_sbtpad.png",
        alt: "Peugeot 5008 0km",
        titulo: "5008",
      },
      partner: {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786956/partner_blanca_epe2vd.webp",
        alt: "Peugeot Partner 0km",
        titulo: "Partner",
      },
      expert: {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786957/expert-blanca_bpowxc.webp",
        alt: "Peugeot Expert 0km",
        titulo: "Expert",
      },
      boxer: {
        src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1766786948/boxer-blanca_zsb84z.webp",
        alt: "Peugeot Boxer 0km",
        titulo: "Boxer",
      },
    },
  },

  footer: {},
}

