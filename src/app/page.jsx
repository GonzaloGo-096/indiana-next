import Link from "next/link";
import Hero from "../components/Hero";
import { CeroKmSection } from "../components/home/CeroKmSection";
import { UsadosSection } from "../components/home/UsadosSection";
import { staticImages } from "../config/cloudinaryStaticImages";
import { getSiteUrl } from "../lib/site-url";
import styles from "./page.module.css";

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
  title: "Indiana Peugeot – Concesionaria Oficial en Tucumán | 0km y Usados",
  description:
    "Indiana Peugeot es concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y amplia selección de vehículos usados multimarca con garantía, financiamiento y servicio postventa profesional.",
  keywords:
    "Indiana Peugeot, concesionaria Peugeot Tucumán, autos 0km Peugeot, autos usados Tucumán, concesionaria oficial Peugeot, vehículos usados con garantía, financiación automotriz Tucumán",
  openGraph: {
    title: "Indiana Peugeot – Concesionaria Oficial en Tucumán | 0km y Usados",
    description:
      "Indiana Peugeot es concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y amplia selección de vehículos usados multimarca con garantía, financiamiento y servicio postventa profesional.",
    url: "/",
    siteName: "Indiana Peugeot",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: `${getSiteUrl()}/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp`,
        alt: "Indiana Peugeot - Concesionaria Oficial",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Indiana Peugeot – Concesionaria Oficial en Tucumán | 0km y Usados",
    description:
      "Indiana Peugeot es concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y amplia selección de vehículos usados multimarca con garantía, financiamiento y servicio postventa profesional.",
    images: [`${getSiteUrl()}/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp`],
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const structuredData = getStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className={styles.home}>
        {/* Sección A: Hero principal con CTAs */}
        <Hero />

        {/* Sección B: Peugeot 0km - Fondo negro */}
        <CeroKmSection />

        {/* Sección C: Usados Multimarca */}
        <UsadosSection />

        {/* Sección D: Banner Postventa */}
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
              <img
                src={staticImages.postventa.hero.src}
                alt={staticImages.postventa.hero.alt}
                className={styles.postventaImage}
                decoding="async"
                loading="lazy"
              />
              <div className={styles.postventaContent}>
                <div className={styles.postventaCtaGroup}>
                  <p className={styles.postventaText}>
                    Elegís tranquilidad. Nosotros nos ocupamos del resto: diagnóstico preciso, mano de obra experta y una experiencia de servicio premium.
                  </p>
                  <Link
                    href="/postventa"
                    className={styles.postventaButton}
                    aria-label="Conocé más sobre Post-venta"
                  >
                    Conocé más
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
