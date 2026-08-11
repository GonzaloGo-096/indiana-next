import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/Hero";
import cta from "@/components/home/HomeSectionCtas.module.css";
import { CeroKmSection } from "@/components/home/CeroKmSection";
import { UsadosSection } from "@/components/home/UsadosSection";
import { staticImages } from "@/config/cloudinaryStaticImages";
import { getSiteUrl } from "@/lib/site-url";
import styles from "../page.module.css";
import { serializeJsonLd } from "@/lib/seo/jsonLd";

// Structured Data: Organization + LocalBusiness + AutomotiveBusiness
function getStructuredData() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Indiana Peugeot",
        legalName: "Indiana Peugeot",
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp`,
        },
        sameAs: [],
      },
      {
        "@type": ["AutomotiveBusiness", "LocalBusiness"],
        "@id": `${siteUrl}/#business`,
        name: "Indiana Peugeot",
        image: `${siteUrl}/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp`,
        url: siteUrl,
        telephone: "+543816295959",
        address: {
          "@type": "PostalAddress",
          addressCountry: "AR",
          addressLocality: "San Miguel de Tucumán",
          addressRegion: "Tucumán",
        },
        priceRange: "$$",
        brand: {
          "@type": "Brand",
          name: "Peugeot",
        },
        areaServed: {
          "@type": "City",
          name: "Tucumán",
        },
      },
    ],
  };
}

export const metadata = {
  title: {
    absolute: "Peugeot Indiana | Autos 0km, Usados y Planes en Tucumán",
  },
  description:
    "Conocé la oferta de Peugeot Indiana en Tucumán: autos 0km, usados seleccionados, planes de ahorro y atención comercial.",
  keywords:
    "Peugeot Indiana, concesionaria Peugeot Tucumán, autos 0km Peugeot, autos usados Tucumán, concesionaria oficial Peugeot, vehículos usados con garantía, financiación automotriz Tucumán",
  openGraph: {
    title: "Peugeot Indiana | Autos 0km, Usados y Planes en Tucumán",
    description:
      "Conocé la oferta de Peugeot Indiana en Tucumán: autos 0km, usados seleccionados, planes de ahorro y atención comercial.",
    url: "/",
    siteName: "Indiana Peugeot",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: `${getSiteUrl()}/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp`,
        alt: "Peugeot Indiana - Concesionaria Oficial",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Peugeot Indiana | Autos 0km, Usados y Planes en Tucumán",
    description:
      "Conocé la oferta de Peugeot Indiana en Tucumán: autos 0km, usados seleccionados, planes de ahorro y atención comercial.",
    images: [`${getSiteUrl()}/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp`],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const structuredData = getStructuredData();

  return (
    <div className={styles.home}>
      <Hero />
      <CeroKmSection />
      <UsadosSection />
      <section
        className={styles.postventa}
        aria-labelledby="home-postventa-title"
      >
        <div className="container">
          <h2
            id="home-postventa-title"
            className={styles.postventaTitle}
          >
            POST-VENTA
          </h2>
          <div className={styles.postventaBanner}>
            {/* next/image y no <img>: con la etiqueta plana el loader de
                Cloudinary nunca intervenía y la imagen se servía original,
                585 KB. Con transformaciones baja a ~25 KB.
                El tamaño real lo sigue poniendo el CSS (.postventaImage:
                alto fijo en mobile, auto en desktop, object-fit cover);
                width/height acá son solo la relación de aspecto que Next
                necesita para reservar el espacio. */}
            <Image
              src={staticImages.postventa.hero.src}
              alt={staticImages.postventa.hero.alt}
              className={styles.postventaImage}
              width={1600}
              height={600}
              sizes="(max-width: 1200px) 100vw, 1200px"
              loading="lazy"
            />
            <div className={styles.postventaContent}>
              <div className={styles.postventaCtaGroup}>
                <p className={styles.postventaText}>
                  Elegís tranquilidad. Nosotros nos ocupamos del resto: diagnóstico preciso, mano de obra experta y una experiencia de servicio premium.
                </p>
                <Link
                  href="/postventa"
                  className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline} ${styles.postventaButton}`}
                  aria-label="Conocé más sobre Post-venta"
                >
                  Conocé más
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
    </div>
  );
}
