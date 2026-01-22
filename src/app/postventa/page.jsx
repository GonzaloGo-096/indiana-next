import { absoluteUrl } from "../../lib/site-url";
import { staticImages } from "../../config/cloudinaryStaticImages";
import PostventaServiceCard from "../../components/postventa/PostventaServiceCard";
import Image from "next/image";
import styles from "./postventa.module.css";

// Datos de los servicios actualizados según referencia
const servicesData = [
  {
    id: "service",
    title: "SERVICE",
    description:
      "Contamos con técnicos certificados, diagnóstico oficial y mantenimiento por plan, con turnos ágiles y seguimiento.",
    image: "taller-3-jpeg",
    alt: "Técnico realizando diagnóstico computarizado en vehículo",
    buttonText: "Reservá tu turno",
    whatsappMessage:
      "¡Hola! Quiero reservar un turno para el service de mi vehículo. ¿Cuál es la disponibilidad más cercana?",
  },
  {
    id: "chapa-pintura",
    title: "CHAPA Y PINTURA",
    description:
      "Ofrecemos reparación integral con cabina presurizada, colorimetría precisa y entrega prolija, apto aseguradoras.",
    image: "taller-2",
    alt: "Especialista trabajando en chapa y pintura de vehículo",
    buttonText: "Cotizá con nosotros",
    whatsappMessage:
      "¡Hola! Necesito una cotización para trabajo de chapa y pintura. ¿Podrían enviarme información de precios?",
  },
  {
    id: "repuestos",
    title: "REPUESTOS",
    description:
      "Piezas originales con garantía; stock habitual, pedidos rápidos e instalación profesional.",
    image: "taller-motor",
    alt: "Repuestos originales y batería de vehículo",
    buttonText: "Consultá productos",
    whatsappMessage:
      "¡Hola! Necesito información sobre repuestos para mi vehículo. ¿Tienen stock disponible?",
  },
];

/**
 * Helper para generar Structured Data (JSON-LD) de servicios de postventa
 * Usa Schema.org Service con ItemList
 */
function getPostventaServicesJsonLd(services) {
  if (!services || !Array.isArray(services) || services.length === 0) {
    return null;
  }

  const serviceListElement = services.map((service, index) => ({
    "@type": "Service",
    position: index + 1,
    name: service.title,
    description: service.description,
    provider: {
      "@type": "AutomotiveBusiness",
      name: "Indiana Peugeot",
    },
    areaServed: {
      "@type": "City",
      name: "Tucumán",
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Servicios Postventa - Indiana Peugeot",
    description: "Servicios profesionales de postventa: service, chapa y pintura, repuestos originales.",
    itemListElement: serviceListElement,
    numberOfItems: serviceListElement.length,
  };
}

/**
 * Generar metadata para la página de postventa
 */
export async function generateMetadata() {
  try {
    return {
      title: "Servicios Postventa | Service, Chapa y Pintura, Repuestos | Indiana Peugeot",
      description:
        "Servicios postventa profesionales: service, chapa y pintura, repuestos originales. Técnicos certificados y garantía en todos nuestros servicios.",
      keywords:
        "service autos usados, mantenimiento vehículos, chapa y pintura autos, repuestos originales",
      openGraph: {
        title: "Servicios Postventa | Indiana Peugeot",
        description:
          "Servicios postventa profesionales: service, chapa y pintura, repuestos originales. Técnicos certificados y garantía en todos nuestros servicios.",
        url: absoluteUrl("/postventa"),
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: [
          {
            url: staticImages.postventa.hero.src,
            alt: "Servicio de postventa Indiana",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Servicios Postventa | Indiana Peugeot",
        description:
          "Servicios postventa profesionales: service, chapa y pintura, repuestos originales. Técnicos certificados y garantía en todos nuestros servicios.",
        images: [staticImages.postventa.hero.src],
      },
      alternates: {
        canonical: absoluteUrl("/postventa"),
      },
    };
  } catch (error) {
    console.error("Error generating metadata for postventa page:", error);
    return {
      title: "Servicios Postventa | Indiana Peugeot",
      description: "Servicios postventa profesionales.",
    };
  }
}

/**
 * Página de servicios de postventa
 * SSG: Se genera estáticamente en build time
 */
export default function PostventaPage() {
  // Generar Structured Data (JSON-LD) para SEO
  const jsonLd = getPostventaServicesJsonLd(servicesData);

  return (
    <div className={styles.pageContainer}>
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="postventa-hero-title">
        <div className="container">
          <div className={styles.heroBanner}>
            <Image
              src={staticImages.postventa.hero.src}
              alt={staticImages.postventa.hero.alt}
              width={1200}
              height={400}
              className={styles.heroImage}
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
            <div className={styles.heroContent}>
              <h1 id="postventa-hero-title" className={styles.heroTitle}>
                POST-VENTA
              </h1>
              <p className={styles.heroDescription}>
                Elegís tranquilidad. Nosotros nos ocupamos del resto: diagnóstico preciso,
                mano de obra experta y una experiencia de servicio premium.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.servicesContainer}>
            {servicesData.map((service) => (
              <PostventaServiceCard key={service.id} {...service} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

