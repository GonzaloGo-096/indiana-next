/**
 * /usados - Página principal de usados (Server Component)
 * 
 * ✅ ARQUITECTURA:
 * - Sección 1: Título + botón "Ver todos" + carrusel de 8 autos
 * - Sección 2: Promociones y formas de pago
 * 
 * @author Indiana Peugeot
 * @version 3.0.0 - Restructurada con carrusel
 */

import Link from "next/link";
import { absoluteUrl } from "../../lib/site-url";
import { vehiclesService } from "../../lib/services/vehiclesApi.server";
import { mapVehiclesPage } from "../../lib/mappers/vehicleMapper";
import UsadosCarousel from "../../components/usados/UsadosCarousel";
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
 * Página principal de usados
 */
export default async function UsadosPage() {
  // Obtener los primeros 8 vehículos para el carrusel
  let vehicles = [];
  
  try {
    const backendData = await vehiclesService.getVehicles({
      filters: {},
      limit: 8,
      cursor: 1,
    });
    
    const mappedData = mapVehiclesPage(backendData, 1);
    vehicles = mappedData.vehicles || [];
  } catch (error) {
    // En caso de error, mostrar carrusel vacío
    if (process.env.NODE_ENV === 'development') {
      console.error("[UsadosPage] Error fetching vehicles:", error);
    }
    vehicles = [];
  }

  return (
    <div className={styles.page}>
      {/* Sección 1: Título + Botón "Ver todos" + Carrusel */}
      <section className={styles.vehiclesSection}>
        <div className={styles.vehiclesContainer}>
          <div className={styles.vehiclesHeader}>
            <h1 className={styles.vehiclesTitle}>Vehículos Usados</h1>
            <Link href="/usados/vehiculos" className={styles.verTodosButton}>
              Ver todos
            </Link>
          </div>
          <UsadosCarousel vehicles={vehicles} />
        </div>
      </section>

      {/* Sección 2: Promociones y Formas de Pago */}
      <section className={styles.promocionesSection}>
        <div className={styles.promocionesContainer}>
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
    </div>
  );
}
