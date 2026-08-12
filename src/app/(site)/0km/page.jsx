import { getAllModelos, getHomeCeroKmCardImage } from "@/data/modelos";
import { getPlanesPorModelo } from "@/data/planes";
import { VehiculosCarouselClient } from "@/components/0km/VehiculosCarouselClient";
import { UtilitariosCarouselClient } from "@/components/0km/UtilitariosCarouselClient";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";
import Link from "next/link";
import cta from "@/components/home/HomeSectionCtas.module.css";
import ItemListViewTracker from "@/components/analytics/ItemListViewTracker";
import { SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { buildItemParamsFromAuto } from "@/lib/analytics/params";
import styles from "./0km.module.css";
import { serializeJsonLd } from "@/lib/seo/jsonLd";

/**
 * CeroKilometrosPage - Server Component
 *
 * ✅ Responsabilidad: Preparar datos y estructura estática
 * ✅ Sin hooks: Todo el procesamiento de datos es síncrono
 * ✅ Interactividad: Delegada a Client Components (carruseles)
 */

// Metadata SEO para la página de listado 0km
export const metadata = {
  title: "Autos 0km Peugeot",
  description:
    "Conocé los modelos Peugeot 0km disponibles en Indiana Tucumán y consultá por versiones, financiación y disponibilidad.",
  openGraph: {
    title: "Autos 0km Peugeot | Peugeot Indiana",
    description:
      "Conocé los modelos Peugeot 0km disponibles en Indiana Tucumán y consultá por versiones, financiación y disponibilidad.",
    type: "website",
    siteName: "Indiana Peugeot",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autos 0km Peugeot | Peugeot Indiana",
    description:
      "Conocé los modelos Peugeot 0km disponibles en Indiana Tucumán y consultá por versiones, financiación y disponibilidad.",
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

  // Intercambiar posición de 2008 y 408 en el carrusel de vehículos
  const vehOrdered = [...veh];
  const idx2008 = vehOrdered.findIndex((m) => lower(m.slug) === "2008");
  const idx408 = vehOrdered.findIndex((m) => lower(m.slug) === "408");
  if (idx2008 >= 0 && idx408 >= 0) {
    [vehOrdered[idx2008], vehOrdered[idx408]] = [vehOrdered[idx408], vehOrdered[idx2008]];
  }

  const getVersionLabels = (modelo) => {
    const labels = (modelo?.versiones || [])
      .map((v) => v?.nombreCorto || v?.nombre || "")
      .map((name) => String(name).trim())
      .filter(Boolean);

    // 208: dejar una sola variante "ALLURE" y completar con el resto principal
    if (String(modelo?.slug || "").toLowerCase() === "208") {
      const unique208 = [];
      let allureIncluded = false;

      for (const label of labels) {
        const isAllure = label.toUpperCase().startsWith("ALLURE");
        if (isAllure) {
          if (allureIncluded) continue;
          unique208.push("ALLURE");
          allureIncluded = true;
          continue;
        }
        unique208.push(label);
      }

      return unique208.slice(0, 3);
    }

    return labels.slice(0, 3);
  };

  const vehiculosCards = vehOrdered.map((modelo) => {
    const img = getHomeCeroKmCardImage(modelo);
    return {
      key: modelo.slug,
      src: img?.url || "",
      alt: img?.alt || modelo.nombre,
      titulo: modelo.nombre,
      slug: modelo.slug,
      versionLabels: getVersionLabels(modelo),
      hasPlanes: getPlanesPorModelo(modelo.slug)?.length > 0,
    };
  });

  const utilitariosCards = util.map((modelo) => {
    const img = getHomeCeroKmCardImage(modelo);
    return {
      key: modelo.slug,
      src: img?.url || "",
      alt: img?.alt || modelo.nombre,
      titulo: modelo.nombre,
      slug: modelo.slug,
      versionLabels: getVersionLabels(modelo),
      hasPlanes: getPlanesPorModelo(modelo.slug)?.length > 0,
    };
  });

  // Generar Structured Data (JSON-LD) para el listado
  // Incluir todos los modelos (vehículos + utilitarios) en el JSON-LD
  const jsonLd = getOkmListJsonLd(allModelos);

  // Items GA4 (allowlist: solo slug + nombre, evita PII)
  const trackingItems = allModelos
    .map((m) =>
      buildItemParamsFromAuto(
        { slug: m.slug, titulo: m.nombre },
        ITEM_LIST.OKM_GRID,
      ),
    )
    .filter(Boolean);

  return (
    <div className={styles.page}>
      <ItemListViewTracker
        items={trackingItems}
        itemListName={ITEM_LIST.OKM_GRID}
        location={LOCATIONS.OKM_LIST}
        source={SOURCES.LISTING_PAGE}
      />
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}

      <header className={styles.pageIntro} aria-label="Presentación catálogo 0km">
        <p className={styles.pageIntroKicker}>Catálogo Peugeot 0km</p>
        <h1 className={styles.pageIntroTitle}>
          Elegí tu <span className={styles.pageIntroTitleAccent}>Peugeot&nbsp;0km</span>
        </h1>
        <p className={styles.pageIntroText}>
          <strong className={styles.pageIntroLead}>
            Queremos mostrarte nuestros modelos de forma clara, cercana y ordenada
          </strong>
          , para que puedas elegir con tranquilidad el Peugeot 0km que mejor se adapte a vos.
        </p>
      </header>

      <div className={styles.sectionHeaderTextOnly}>
        <h2 className={styles.sectionTitle}>Vehículos</h2>
      </div>
      <VehiculosCarouselClient
        cards={vehiculosCards}
        compact
        softSurface
        frameless
        showActionButtons
        fullViewport
        okmShowcase
      />

      <div className={styles.sectionHeaderTextOnly}>
        <h2 className={styles.sectionTitle}>Utilitarios</h2>
      </div>

      {/* ✅ Client Component para interactividad del carrusel */}
      <UtilitariosCarouselClient
        cards={utilitariosCards}
        compact
        softSurface
        frameless
        showActionButtons
        fullViewport
        okmShowcase
      />

      <section className={styles.financingBridge} aria-labelledby="financiacion-heading">
        <h3 id="financiacion-heading" className={styles.financingTitle}>Financiación disponible</h3>
        <div className={styles.financingContent}>
          <p className={styles.financingText}>
            Conocé nuestros planes disponibles y elegí la alternativa que mejor te conviene
            para financiar tu próximo 0km.
          </p>
          <Link
            href="/planes"
            className={`${cta.button} ${cta.buttonInline} ${styles.financingLink}`}
          >
            Ver planes
          </Link>
        </div>
      </section>
    </div>
  );
}
