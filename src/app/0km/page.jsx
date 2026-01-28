import { getAllModelos } from "../../data/modelos";
import { staticImages } from "../../config/cloudinaryStaticImages";
import { VehiculosCarouselClient } from "../../components/0km/VehiculosCarouselClient";
import { UtilitariosCarouselClient } from "../../components/0km/UtilitariosCarouselClient";
import { getSiteUrl, absoluteUrl } from "../../lib/site-url";
import Image from "next/image";
import Link from "next/link";
import styles from "./0km.module.css";

/**
 * CeroKilometrosPage - Server Component
 * 
 * ✅ Responsabilidad: Preparar datos y estructura estática
 * ✅ Sin hooks: Todo el procesamiento de datos es síncrono
 * ✅ Interactividad: Delegada a Client Components (carruseles)
 */

// Metadata SEO para la página de listado 0km
export const metadata = {
  title: "Catálogo Peugeot 0km en Tucumán | Concesionaria Oficial | Indiana Peugeot",
  description:
    "Gama completa de modelos Peugeot 0km en Indiana Peugeot, concesionaria oficial en Tucumán. Autos y utilitarios nuevos con garantía oficial y opciones de financiación.",
  openGraph: {
    title: "Catálogo Peugeot 0km en Tucumán | Concesionaria Oficial | Indiana Peugeot",
    description:
      "Gama completa de modelos Peugeot 0km en Indiana Peugeot, concesionaria oficial en Tucumán. Autos y utilitarios nuevos con garantía oficial y opciones de financiación.",
    type: "website",
    siteName: "Indiana Peugeot",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo Peugeot 0km en Tucumán | Concesionaria Oficial | Indiana Peugeot",
    description:
      "Gama completa de modelos Peugeot 0km en Indiana Peugeot, concesionaria oficial en Tucumán. Autos y utilitarios nuevos con garantía oficial y opciones de financiación.",
  },
  alternates: {
    canonical: `${getSiteUrl()}/0km`,
  },
};

/**
 * Helper para generar Structured Data (JSON-LD) del listado de modelos 0km
 * Usa Schema.org ItemList
 * 
 * @param {Array} modelos - Array de todos los modelos (vehículos + utilitarios)
 * @returns {Object|null} Objeto JSON-LD serializable o null si no hay modelos
 */
function getOkmListJsonLd(modelos) {
  if (!modelos || !Array.isArray(modelos) || modelos.length === 0) {
    return null;
  }

  // Crear ItemList con todos los modelos usando URLs absolutas
  const itemListElement = modelos.map((modelo, index) => {
    const modelSlug = modelo.slug || modelo.id;
    const modelName = `${modelo.marca || "Peugeot"} ${modelo.nombre || ""} 0km`;
    // ✅ Usar absoluteUrl para URLs absolutas
    const modelUrl = absoluteUrl(`/0km/${modelSlug}`);

    return {
      "@type": "ListItem",
      position: index + 1,
      url: modelUrl,
      name: modelName,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Catálogo Peugeot 0km",
    itemListElement: itemListElement.length > 0 ? itemListElement : undefined,
    numberOfItems: itemListElement.length,
  };

  // Limpiar propiedades undefined
  Object.keys(jsonLd).forEach((key) => {
    if (jsonLd[key] === undefined) {
      delete jsonLd[key];
    }
  });

  return jsonLd;
}

export default function CeroKilometrosPage() {
  // ✅ Procesamiento de datos en Server (sin hooks)
  const utilitariosKeys = ["partner", "expert", "boxer"];
  const allModelos = getAllModelos();
  const lower = (s) => (s || "").toLowerCase();
  
  const util = allModelos.filter((m) =>
    utilitariosKeys.includes(lower(m.slug))
  );
  const veh = allModelos.filter(
    (m) => !utilitariosKeys.includes(lower(m.slug))
  );

  // ✅ Preparar cards en Server (sin useMemo, solo procesamiento)
  const vehiculosCards = veh.map((modelo) => {
    const staticImage = staticImages.ceroKm.modelos[modelo.slug];
    const imageSrc = staticImage?.src || modelo.heroImage?.url || "";
    const imageAlt = staticImage?.alt || modelo.heroImage?.alt || modelo.nombre;
    const titulo = staticImage?.titulo || modelo.nombre;

    return {
      key: modelo.slug,
      src: imageSrc,
      alt: imageAlt,
      titulo: titulo,
      slug: modelo.slug,
    };
  });

  const utilitariosCards = util.map((modelo) => {
    const staticImage = staticImages.ceroKm.modelos[modelo.slug];
    const imageSrc = staticImage?.src || modelo.heroImage?.url || "";
    const imageAlt = staticImage?.alt || modelo.heroImage?.alt || modelo.nombre;
    const titulo = staticImage?.titulo || modelo.nombre;

    return {
      key: modelo.slug,
      src: imageSrc,
      alt: imageAlt,
      titulo: titulo,
      slug: modelo.slug,
    };
  });

  // Generar Structured Data (JSON-LD) para el listado
  // Incluir todos los modelos (vehículos + utilitarios) en el JSON-LD
  const jsonLd = getOkmListJsonLd(allModelos);

  return (
    <div className={styles.page}>
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Catálogo Peugeot 0km</h1>
          <p className={styles.subtitle}>
            Concesionaria oficial Peugeot en Tucumán. Gama completa de modelos
            nuevos con garantía oficial y financiación disponible.
          </p>
        </div>
      </header>

      <div className={styles.sectionHeader}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLogoWrapper}>
            <div className={styles.sectionLine}></div>
            <Image
              src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
              alt="Logo Peugeot"
              width={150}
              height={150}
              className={styles.sectionLogo}
              sizes="(max-width: 768px) 100px, 150px"
              priority
            />
            <div className={styles.sectionLine}></div>
          </div>
          <h2 className={styles.sectionTitle}>Gama de vehículos</h2>
        </div>
      </div>
      {/* ✅ Client Component para interactividad del carrusel */}
      <VehiculosCarouselClient cards={vehiculosCards} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLogoWrapper}>
            <div className={styles.sectionLine}></div>
            <Image
              src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
              alt="Logo Peugeot"
              width={150}
              height={150}
              className={styles.sectionLogo}
              sizes="(max-width: 768px) 100px, 150px"
              loading="lazy"
            />
            <div className={styles.sectionLine}></div>
          </div>
          <h2 className={styles.sectionTitle}>Gama de utilitarios</h2>
        </div>
      </div>
      {/* ✅ Client Component para interactividad del carrusel */}
      <UtilitariosCarouselClient cards={utilitariosCards} />

      <section className={styles.financingBridge}>
        <div className={styles.financingContent}>
          <h3 className={styles.financingTitle}>Financiación disponible</h3>
          <p className={styles.financingText}>
            Consultá nuestros planes de financiación para modelos Peugeot 0km.
            Opciones flexibles adaptadas a tu necesidad.
          </p>
          <Link href="/planes" className={styles.financingLink}>
            Ver planes
          </Link>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <p className={styles.ctaText}>
          ¿Querés más información sobre algún modelo?
        </p>
        <a
          href="https://wa.me/543816295959?text=Hola!%20Me%20interesa%20conocer%20más%20sobre%20los%20modelos%200km"
          className={styles.ctaButton}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            className={styles.whatsappIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          <span>Contactanos por WhatsApp</span>
        </a>
      </section>
    </div>
  );
}
