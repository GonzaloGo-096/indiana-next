/**
 * /usados - Página de promociones y formas de pago (Server Component)
 * 
 * ✅ ARQUITECTURA:
 * - Solo muestra información de promociones y formas de pago
 * - Link a /usados/vehiculos para ver el catálogo completo
 * 
 * @author Indiana Peugeot
 * @version 2.0.0 - Separada de lista de vehículos
 */

import Link from "next/link";
import { absoluteUrl } from "../../lib/site-url";
import styles from "./usados.module.css";

/**
 * Metadata para SEO
 */
export async function generateMetadata() {
  const title = "Vehículos Usados Multimarca | Indiana Peugeot";
  const description =
    "Amplia selección de vehículos usados multimarca en Indiana Peugeot. Garantía incluida, financiación disponible y servicio postventa profesional.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl("/usados"),
      siteName: "Indiana Peugeot",
      locale: "es_AR",
      type: "website",
      images: [
        {
          url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"),
          alt: "Vehículos Usados Multimarca - Indiana Peugeot",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp")],
    },
    alternates: {
      canonical: absoluteUrl("/usados"),
    },
  };
}

/**
 * Página principal de usados (solo promociones)
 */
export default function UsadosPage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Vehículos Usados Multimarca</h1>
          <p className={styles.subtitle}>
            Amplia selección de vehículos usados con garantía, financiación
            disponible y servicio postventa profesional.
          </p>
        </div>
      </header>

      {/* Sección de Promociones */}
      <section className={styles.promocionesSection}>
        <div className="container">
          <h2 className={styles.promocionesTitle}>
            Promociones y Formas de Pago
          </h2>
          <div className={styles.promocionesGrid}>
            <div className={styles.promocionCard}>
              <h3 className={styles.cardTitle}>Financiación</h3>
              <p className={styles.cardText}>
                Financiación disponible con cuotas fijas en pesos. Consultá las
                mejores opciones para tu vehículo.
              </p>
            </div>
            <div className={styles.promocionCard}>
              <h3 className={styles.cardTitle}>Garantía Incluida</h3>
              <p className={styles.cardText}>
                Todos nuestros vehículos usados incluyen garantía. Tranquilidad
                y confianza en tu compra.
              </p>
            </div>
            <div className={styles.promocionCard}>
              <h3 className={styles.cardTitle}>Formas de Pago</h3>
              <p className={styles.cardText}>
                Efectivo, transferencia, cheque o financiación. Adaptamos el
                pago a tus necesidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA para ver catálogo */}
      <section className={styles.ctaSection}>
        <div className="container">
          <Link href="/usados/vehiculos" className={styles.ctaButton}>
            Ver Catálogo Completo
          </Link>
        </div>
      </section>
    </div>
  );
}
