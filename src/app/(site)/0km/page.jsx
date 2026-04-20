import { getAllModelos } from "../../../data/modelos";
import { staticImages } from "../../../config/cloudinaryStaticImages";
import { VehiculosCarouselClient } from "../../../components/0km/VehiculosCarouselClient";
import { UtilitariosCarouselClient } from "../../../components/0km/UtilitariosCarouselClient";
import { getSiteUrl, absoluteUrl } from "../../../lib/site-url";
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

      <div className={styles.sectionHeader}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLogoWrapper}>
            <div className={styles.sectionLine}></div>
            <Image
              src="/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp"
              alt="Logo Indiana Peugeot"
              width={150}
              height={150}
              className={styles.sectionLogo}
              style={{ width: "auto", height: "auto" }}
              sizes="(max-width: 768px) 100px, 150px"
              priority
            />
            <div className={styles.sectionLine}></div>
          </div>
          <h2 className={styles.sectionTitle}>Vehículos</h2>
        </div>
      </div>
      <VehiculosCarouselClient cards={vehiculosCards} />

      <div className={styles.sectionHeader}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionLogoWrapper}>
            <div className={styles.sectionLine}></div>
            <Image
              src="/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp"
              alt="Logo Indiana Peugeot"
              width={150}
              height={150}
              className={styles.sectionLogo}
              style={{ width: "auto", height: "auto" }}
              sizes="(max-width: 768px) 100px, 150px"
              loading="lazy"
            />
            <div className={styles.sectionLine}></div>
          </div>
          <h2 className={styles.sectionTitle}>Utilitarios</h2>
        </div>
      </div>
      {/* ✅ Client Component para interactividad del carrusel */}
      <UtilitariosCarouselClient cards={utilitariosCards} />

      <section className={styles.financingBridge} aria-labelledby="financiacion-heading">
        <h3 id="financiacion-heading" className={styles.financingTitle}>Financiación disponible</h3>
        <div className={styles.financingContent}>
          <p className={styles.financingText}>
            Consultá nuestros planes de financiación para modelos Peugeot 0km.
            Opciones flexibles adaptadas a tu necesidad.
          </p>
          <Link href="/planes" className={styles.financingLink}>
            Ver planes
          </Link>
        </div>
      </section>
    </div>
  );
}
