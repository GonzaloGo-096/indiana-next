import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getModelo, getModelosSlugs } from "../../../data/modelos";
import { getPlanesPorModelo } from "../../../data/planes";
import { absoluteUrl } from "../../../lib/site-url";
import { ModeloDetalleClient } from "./ModeloDetalleClient";
import { HeroImageDesktop } from "./HeroImageDesktop";
import styles from "./0km-detalle.module.css";

// ✅ Lazy loading de componentes condicionales para mejor code splitting
// Estos componentes solo se cargan cuando se necesitan, reduciendo el bundle inicial

// ✅ Lazy loading de componentes condicionales para mejor code splitting
// Nota: En Server Components, no podemos usar ssr: false, así que usamos ssr: true por defecto
// Los componentes Client Components se hidratarán correctamente en el cliente

// ✅ OPTIMIZADO: Dynamic imports corregidos para evitar errores de chunks
// ModeloPlanes - Solo para modelos con planes (208, 2008, partner, expert)
// Exporta como default, usar import directo
const ModeloPlanes = dynamic(
  () => import("../../../components/ceroKm/ModeloPlanes/ModeloPlanes"),
  {
    loading: () => (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#666" }}>Cargando planes...</div>
      </div>
    ),
  }
);

// FeatureSection - Solo para modelos con features
// Usar ruta directa al componente (evitar index.js que puede causar problemas)
const FeatureSection = dynamic(
  () => import("../../../components/ceroKm/FeatureSection/FeatureSection"),
  {
    loading: () => (
      <div
        style={{
          padding: "2rem",
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "200px",
            background: "#f0f0f0",
            borderRadius: "8px",
          }}
        />
        <div
          style={{
            width: "80%",
            height: "20px",
            background: "#f0f0f0",
            borderRadius: "4px",
          }}
        />
      </div>
    ),
  }
);

// ModelGallery - Solo para modelos con galería
// Ahora tiene default export, usar import directo
const ModelGallery = dynamic(
  () => import("../../../components/ceroKm/ModelGallery"),
  {
    loading: () => (
      <div
        style={{
          padding: "2rem",
          minHeight: "400px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "4/3",
                background: "#f0f0f0",
                borderRadius: "8px",
              }}
            />
          ))}
        </div>
      </div>
    ),
  }
);

/**
 * Helper para generar Structured Data (JSON-LD) del modelo
 * Usa Schema.org Product para automóviles
 * 
 * @param {Object} params
 * @param {Object} params.modelo - Objeto modelo completo
 * @param {string} params.canonicalUrl - URL canónica de la página
 * @returns {Object} Objeto JSON-LD serializable
 */
function getModeloJsonLd({ modelo, canonicalUrl }) {
  if (!modelo) return null;

  const productName = `${modelo.marca} ${modelo.nombre} 0km`;
  const productDescription =
    modelo.seo?.description ||
    `${modelo.marca} ${modelo.nombre} 0km disponible en Indiana Peugeot, concesionaria oficial en Tucumán.`;
  
  // Usar heroImage o imagenPrincipal como imagen principal
  const productImage = modelo.heroImage?.url || modelo.imagenPrincipal?.url || null;

  // Construir array de imágenes si hay galería
  const images = [];
  if (productImage) {
    images.push(productImage);
  }
  if (modelo.galeria?.desktop) {
    modelo.galeria.desktop.forEach((img) => {
      if (img.url && !images.includes(img.url)) {
        images.push(img.url);
      }
    });
  } else if (modelo.galeria?.mobile) {
    modelo.galeria.mobile.forEach((img) => {
      if (img.url && !images.includes(img.url)) {
        images.push(img.url);
      }
    });
  }

  // Verificar si hay precio real disponible
  // Buscar en posibles campos: modelo.precio, modelo.price, modelo.valor, etc.
  const precioReal =
    modelo.precio ||
    modelo.price ||
    modelo.valor ||
    modelo.pricing?.price ||
    null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    brand: {
      "@type": "Brand",
      name: modelo.marca,
    },
    category: "Automotive",
    description: productDescription,
    image: images.length > 0 ? images : undefined,
    url: canonicalUrl,
  };

  // Solo incluir offers si hay precio real disponible
  // Sin price, offers puede generar warnings en validadores de Schema.org
  if (precioReal && typeof precioReal === "number" && precioReal > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "ARS",
      price: precioReal,
    };
  }

  // Agregar año del modelo si está disponible
  if (modelo.año) {
    jsonLd.model = `${modelo.año}`;
  }

  // Limpiar propiedades undefined
  Object.keys(jsonLd).forEach((key) => {
    if (jsonLd[key] === undefined) {
      delete jsonLd[key];
    }
  });

  return jsonLd;
}

// SSG: Generar paths estáticos
export async function generateStaticParams() {
  try {
    const slugs = getModelosSlugs();

    if (!Array.isArray(slugs) || slugs.length === 0) {
      console.warn("No se encontraron slugs de modelos para generar rutas estáticas");
      return [];
    }

    return slugs.map((slug) => ({
      autoSlug: slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    // Retornar array vacío en caso de error para evitar fallo del build
    return [];
  }
}

// Metadata dinámica por página
export async function generateMetadata({ params }) {
  try {
    const { autoSlug } = await params;
    const modelo = getModelo(autoSlug);

    if (!modelo) {
      return {
        title: "Modelo no encontrado | Indiana Peugeot",
        description: "El modelo solicitado no está disponible.",
      };
    }

    // Usar absoluteUrl para canonical y og:url (URLs absolutas)
    const canonicalUrl = absoluteUrl(`/0km/${autoSlug}`);
    
    const seoTitle =
      modelo.seo?.title ||
      `${modelo.marca} ${modelo.nombre} 0km en Tucumán | Concesionaria Oficial | Indiana Peugeot`;
    const seoDescription =
      modelo.seo?.description ||
      `Peugeot ${modelo.nombre} 0km disponible en Indiana Peugeot, concesionaria oficial en Tucumán. Financiación disponible.`;
    
    // Imagen SEO: si es relativa, convertir a absoluta; si ya es absoluta (Cloudinary), mantenerla
    const seoImage = modelo.heroImage?.url || modelo.imagenPrincipal?.url;
    const seoImageAbsolute = seoImage
      ? seoImage.startsWith("http") || seoImage.startsWith("//")
        ? seoImage
        : absoluteUrl(seoImage)
      : null;
    
    const keywords =
      modelo.seo?.keywords ||
      `${modelo.marca} ${modelo.nombre} 0km Tucumán, concesionaria Peugeot Tucumán, autos 0km Peugeot, financiación Peugeot`;

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: keywords,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: canonicalUrl, // ✅ URL absoluta consistente con canonical
        siteName: "Indiana Peugeot",
        images: seoImageAbsolute
          ? [
              {
                url: seoImageAbsolute, // ✅ URL absoluta
                alt: modelo.heroImage?.alt || `${modelo.marca} ${modelo.nombre}`,
                width: 1200,
                height: 630,
              },
            ]
          : [],
        locale: "es_AR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description: seoDescription,
        images: seoImageAbsolute ? [seoImageAbsolute] : [], // ✅ URL absoluta
      },
      alternates: {
        canonical: canonicalUrl, // ✅ URL absoluta
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    // Retornar metadata por defecto en caso de error
    return {
      title: "Error | Indiana Peugeot",
      description: "Error al cargar la información del modelo.",
    };
  }
}

export default async function CeroKilometroDetallePage({ params }) {
  const { autoSlug } = await params;
  const modelo = getModelo(autoSlug);

  if (!modelo) {
    notFound();
  }

  // Generar Structured Data (JSON-LD) con URL absoluta
  const canonicalUrl = absoluteUrl(`/0km/${autoSlug}`);
  const jsonLd = getModeloJsonLd({ modelo, canonicalUrl });

  return (
    <div className={styles.page}>
      {/* Structured Data (JSON-LD) para SEO */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {/* Hero Image (solo desktop) - Client Component para evitar carga en mobile */}
      {modelo.heroImage && (
        <HeroImageDesktop heroImage={{ ...modelo.heroImage, modelName: modelo.nombre }} />
      )}

      {/* Header - Debajo del hero */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span>{modelo.marca}</span>
          <span className={styles.modelName}>{modelo.nombre}</span>
        </h1>
      </header>

      {/* Client Component: Tabs, VersionContent, Gallery */}
      <ModeloDetalleClient autoSlug={autoSlug} modelo={modelo} />

      {/* Secciones de características destacadas (si el modelo las tiene) */}
      {modelo.features && modelo.features.length > 0 && (
        <>
          {modelo.features.map((feature, index) => {
            const isLast = index === modelo.features.length - 1;
            return (
              <FeatureSection
                key={feature.id}
                feature={feature}
                reverse={index % 2 === 1}
                modeloNombre={modelo.nombre}
                isLast={isLast}
              />
            );
          })}
        </>
      )}

      {/* Sección de planes de financiación (solo para modelos con planes: 208, 2008, partner, expert) */}
      {(() => {
        const planes = getPlanesPorModelo(autoSlug);
        if (planes && planes.length > 0) {
          return <ModeloPlanes modeloSlug={autoSlug} />;
        }
        return null;
      })()}

      {/* Sección de dimensiones (solo para utilitarios: Partner, Expert y Boxer) */}
      {(autoSlug === "partner" ||
        autoSlug === "expert" ||
        autoSlug === "boxer") && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
          <p>Dimensions Section (placeholder)</p>
        </div>
      )}

      {/* CTA Contacto - Antes de la galería */}
      <div className={styles.ctaContainer}>
        <section className={styles.ctaSection}>
          <p className={styles.ctaText}>
            ¿Querés más información sobre el {modelo.marca} {modelo.nombre}?
          </p>
          <a
            href={`https://wa.me/543816295959?text=${encodeURIComponent(
              `Hola! Me interesa conocer más sobre el ${modelo.marca} ${modelo.nombre} 0km`
            )}`}
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

      {/* Galería de imágenes del modelo (fija, no cambia con versión) */}
      {modelo.galeria && (
        <ModelGallery images={modelo.galeria} title="Galería" />
      )}
    </div>
  );
}
