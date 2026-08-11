import { getAllPlanes, extraerModeloBase } from "../../../data/planes";
import { absoluteUrl } from "../../../lib/site-url";
import { PlanesClient } from "./PlanesClient";
import { createLogger } from "@/lib/logger";
import styles from "./planes.module.css";
import { serializeJsonLd } from "@/lib/seo/jsonLd";

const log = createLogger("planes");

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
      title: "Planes de Ahorro Peugeot",
      description:
        "Consultá planes de ahorro Peugeot disponibles en Indiana Tucumán y recibí asesoramiento comercial.",
      keywords:
        "planes de ahorro Peugeot, planes Peugeot Tucumán, financiación Peugeot 0km, cuotas Peugeot, concesionaria oficial Peugeot Tucumán",
      openGraph: {
        title: "Planes de Ahorro Peugeot | Peugeot Indiana",
        description:
          "Consultá planes de ahorro Peugeot disponibles en Indiana Tucumán y recibí asesoramiento comercial.",
        url: absoluteUrl("/planes"),
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: [
          {
            url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"),
            alt: "Planes de Ahorro Peugeot - Peugeot Indiana",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Planes de Ahorro Peugeot | Peugeot Indiana",
        description:
          "Consultá planes de ahorro Peugeot disponibles en Indiana Tucumán y recibí asesoramiento comercial.",
        images: [absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp")],
      },
      alternates: {
        canonical: absoluteUrl("/planes"),
      },
    };
  } catch (error) {
    log.error("generateMetadata falló, usando fallback:", error);
    return {
      title: "Planes de Ahorro Peugeot",
      description: "Planes de ahorro Peugeot en Tucumán.",
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
    <div className={`${styles.planesPage} w-full min-w-0 antialiased`}>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      <PlanesClient planesPorModelo={planesPorModelo} />
    </div>
  );
}
