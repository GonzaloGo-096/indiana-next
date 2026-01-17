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
 * @type {Object<string, {src: string, alt: string, size?: string}>}
 */
export const BRAND_LOGOS = {
  // Marcas con logos disponibles
  peugeot: {
    src: "/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp",
    alt: "Logo Peugeot",
    size: "small",
  },
  "peugeot-vintage": {
    src: "/assets/logos/brands/Peugeot_logo_vintage.webp",
    alt: "Logo Peugeot Vintage",
  },
  fiat: {
    src: "/assets/logos/brands/Fiat-Logo-PNG.webp",
    alt: "Logo Fiat",
    size: "small",
  },
  ford: {
    src: "/assets/logos/brands/Ford-logo-1.webp",
    alt: "Logo Ford",
    size: "large", // Logo Ford más grande
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

