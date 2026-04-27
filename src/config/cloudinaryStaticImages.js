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
 * - footer: (reservado)
 *
 * Imágenes de tarjetas 0km (carruseles): ver getHomeCeroKmCardImage en data/modelos (catálogo COLORES).
 * 
 * @author Indiana Usados
 * @version 2.1.0 - ceroKm movido a data/modelos (COLORES)
 */

export const staticImages = {
  home: {
    heroDesktop: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1773959191/408-inicio-desktop_h8rzgp.webp",
      alt: "Peugeot 408 - Indiana Peugeot",
    },
    heroMobile: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1773959192/408-inicio-mobile_zqscbs.webp",
      alt: "Peugeot 408 - Indiana Peugeot",
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

  careers: {
    hero: {
      src: "https://res.cloudinary.com/drbeomhcu/image/upload/v1772030637/RRHH-desktop_ik9yap.webp",
      alt: "Trabajá con nosotros en Indiana Peugeot - Concesionaria oficial Peugeot",
    },
  },

  footer: {},
}



