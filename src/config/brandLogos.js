/**
 * brandLogos.js - Configuración centralizada de logos de marcas
 * 
 * Mapea brandKey normalizado a la configuración del logo (src, alt).
 * Los logos se sirven desde /public/assets/logos/brands/
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Migración desde React
 */

/**
 * Mapping de brandKey → configuración del logo
 * 
 * brandKey debe ser:
 * - lowercase
 * - sin espacios ni caracteres especiales
 * - normalizado (ej: "mercedes-benz" → "mercedesbenz")
 * 
 * Ajustes opcionales por marca (solo CardAuto):
 * - scale: número (ej. 1.08 = más grande, 0.92 = más chico)
 * - offsetY: px (ej. -4 = más arriba, 2 = más abajo)
 * - offsetX: px (ej. 6 = más derecha, -4 = más izquierda)
 *
 * @type {Object<string, {src: string, alt: string, size?: string, scale?: number, offsetY?: number, offsetX?: number}>}
 */
export const BRAND_LOGOS = {
  // Marcas con logos disponibles
  peugeot: {
    src: "/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp",
    alt: "Logo Peugeot",
    size: "small",
    scale: 0.92,
  },
  "peugeot-vintage": {
    src: "/assets/logos/brands/Peugeot_logo_vintage.webp",
    alt: "Logo Peugeot Vintage",
  },
  fiat: {
    src: "/assets/logos/brands/Fiat-Logo-PNG.webp",
    alt: "Logo Fiat",
    size: "small",
    scale: 0.92,
  },
  ford: {
    src: "/assets/logos/brands/Ford-logo-1.webp",
    alt: "Logo Ford",
    size: "large",
    offsetY: -16,
  },
  honda: {
    src: "/assets/logos/brands/Honda_logo_PNG5.webp",
    alt: "Logo Honda",
    size: "large",
  },
  nissan: {
    src: "/assets/logos/brands/Nissan-Logo-PNG.webp",
    alt: "Logo Nissan",
  },
  renault: {
    src: "/assets/logos/brands/Renault-Logo-PNG.webp",
    alt: "Logo Renault",
    scale: 0.92,
  },
  toyota: {
    src: "/assets/logos/brands/Toyota-logo-1.webp",
    alt: "Logo Toyota",
  },
  citroen: {
    src: "/assets/logos/brands/Citroen-Logo_PNG1.webp",
    alt: "Logo Citroën",
  },
  chevrolet: {
    src: "/assets/logos/brands/Chevrolet_logo_PNG7.webp",
    alt: "Logo Chevrolet",
  },
  bmw: {
    src: "/assets/logos/brands/BMW_logo_PNG1.webp",
    alt: "Logo BMW",
  },
  audi: {
    src: "/assets/logos/brands/Audi-Logo-PNG.webp",
    alt: "Logo Audi",
    offsetY: -6,
  },
  jeep: {
    src: "/assets/logos/brands/Jeep_logo_PNG1-.webp",
    alt: "Logo Jeep",
  },
  hyundai: {
    src: "/assets/logos/brands/Hyundai_logo_PNG1.webp",
    alt: "Logo Hyundai",
  },
  kia: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Kia",
  },
  mazda: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Mazda",
  },
  subaru: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Subaru",
  },
  mitsubishi: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Mitsubishi",
  },
  suzuki: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Suzuki",
  },
  daihatsu: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Daihatsu",
  },
  opel: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Opel",
  },
  mercedesbenz: {
    src: "/assets/logos/brands/Mercedes_logo_PNG1.webp",
    alt: "Logo Mercedes-Benz",
  },
  volkswagen: {
    src: "/assets/logos/brands/Volkswagen_logo_PNG5.webp",
    alt: "Logo Volkswagen",
    scale: 1.12,
    offsetY: -14,
    offsetX: 6,
  },
  volvo: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Volvo",
  },
  jaguar: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Jaguar",
  },
  landrover: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Land Rover",
  },
  mini: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Mini",
  },
  smart: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Smart",
  },
  alfaromeo: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Alfa Romeo",
  },
  chery: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Chery",
  },
  geely: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Geely",
  },
  byd: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo BYD",
  },
  tesla: {
    src: "/assets/logos/brands/logo-negro.webp",
    alt: "Logo Tesla",
  },
};

/**
 * Logo por defecto (fallback)
 * Se usa cuando:
 * - brandKey no existe en BRAND_LOGOS
 * - brandKey es undefined o null
 * - marca no se puede normalizar
 * 
 * @type {{src: string, alt: string}}
 */
export const DEFAULT_BRAND_LOGO = {
  src: "/assets/logos/brands/logo-negro.webp",
  alt: "Logo de marca",
};



