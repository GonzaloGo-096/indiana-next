import { getAllPlanes, extraerModeloBase } from "../../data/planes";
import { absoluteUrl } from "../../lib/site-url";
import { PlanesClient } from "./PlanesClient";
import styles from "./planes.module.css";

/**
 * Helper para generar Structured Data (JSON-LD) del listado de planes
 * Usa Schema.org ItemList
 */
function getPlanesListJsonLd(planes) {
  if (!planes || !Array.isArray(planes) || planes.length === 0) {
    return null;
  }

  const itemListElement = planes.map((plan, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absoluteUrl(`/planes/${plan.id}`),
    name: `Plan ${plan.plan}`,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Planes de Financiación Peugeot 0km",
    itemListElement,
    numberOfItems: itemListElement.length,
  };
}

/**
 * Generar metadata para la página de planes
 */
export async function generateMetadata() {
  try {
    return {
      title: "Financiá tu Peugeot 0km | Planes en Tucumán | Indiana Peugeot",
      description:
        "Planes de financiación flexibles para modelos Peugeot 0km en Tucumán. Concesionaria oficial Peugeot con cuotas adaptadas a tu presupuesto y adjudicación pactada.",
      keywords:
        "planes Peugeot Tucumán, financiación Peugeot 0km, planes de ahorro Peugeot, cuotas Peugeot, concesionaria oficial Peugeot Tucumán, financiación automotriz",
      openGraph: {
        title: "Financiá tu Peugeot 0km | Planes en Tucumán | Indiana Peugeot",
        description:
          "Planes de financiación flexibles para modelos Peugeot 0km en Tucumán. Concesionaria oficial Peugeot con cuotas adaptadas a tu presupuesto y adjudicación pactada.",
        url: absoluteUrl("/planes"),
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: [
          {
            url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"),
            alt: "Planes de Financiación - Indiana Peugeot",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Financiá tu Peugeot 0km | Planes en Tucumán | Indiana Peugeot",
        description:
          "Planes de financiación flexibles para modelos Peugeot 0km en Tucumán. Concesionaria oficial Peugeot con cuotas adaptadas a tu presupuesto y adjudicación pactada.",
        images: [absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp")],
      },
      alternates: {
        canonical: absoluteUrl("/planes"),
      },
    };
  } catch (error) {
    console.error("Error generating metadata for planes page:", error);
    return {
      title: "Planes | Indiana Peugeot",
      description: "Planes de financiación para Peugeot 0km.",
    };
  }
}

/**
 * Página principal de planes de financiación
 * SSG: Se genera estáticamente en build time
 */
export default function PlanesPage() {
  // Agrupar planes por modelo (server-side)
  const planesPorModelo = {};
  const allPlanes = getAllPlanes();

  allPlanes.forEach((plan) => {
    plan.modelos.forEach((nombreModelo) => {
      // Extraer el modelo base (2008, 208, Expert, Partner)
      const modeloBase = extraerModeloBase(nombreModelo);

      if (!planesPorModelo[modeloBase]) {
        planesPorModelo[modeloBase] = [];
      }

      // Evitar duplicados
      if (!planesPorModelo[modeloBase].find((p) => p.id === plan.id)) {
        planesPorModelo[modeloBase].push(plan);
      }
    });
  });

  // Generar Structured Data (JSON-LD) para el listado
  const jsonLd = getPlanesListJsonLd(allPlanes);

  return (
    <div className={styles.planesPage}>
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Header / Hero Liviano */}
      <header className={styles.header}>
        <h1 className={styles.title}>Financiá tu Peugeot 0km</h1>
        <p className={styles.subtitle}>
          Planes de financiación flexibles en Tucumán. Concesionaria oficial
          Peugeot con cuotas adaptadas a tu presupuesto y adjudicación pactada.
        </p>
      </header>

      {/* Contenido con carruseles por modelo */}
      <PlanesClient planesPorModelo={planesPorModelo} />
    </div>
  );
}

