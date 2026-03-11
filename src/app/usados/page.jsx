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
import { USADOS_WHATSAPP_NUMBER } from "../../components/layout/Footer/footerConfig";
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

    // Reordenar: Ford ↔ Renault, Nissan ↔ Volkswagen (por posición en el carrusel)
    const norm = (m) => (m || "").trim().toLowerCase();
    const list = [...vehicles];
    const iFord = list.findIndex((v) => norm(v.marca) === "ford");
    const iRenault = list.findIndex((v) => norm(v.marca) === "renault");
    const iNissan = list.findIndex((v) => norm(v.marca) === "nissan");
    const iVw = list.findIndex((v) => norm(v.marca) === "volkswagen");
    if (iFord >= 0 && iRenault >= 0) {
      [list[iFord], list[iRenault]] = [list[iRenault], list[iFord]];
    }
    if (iNissan >= 0 && iVw >= 0) {
      [list[iNissan], list[iVw]] = [list[iVw], list[iNissan]];
    }
    vehicles = list;
  } catch (error) {
    // En caso de error, mostrar carrusel vacío
    if (process.env.NODE_ENV === 'development') {
      console.error("[UsadosPage] Error fetching vehicles:", error);
    }
    vehicles = [];
  }

  return (
    <div className={styles.page}>
      {/* Sección 1: Promociones (arriba) */}
      <section className={styles.promocionesSection} aria-labelledby="promociones-heading">
        <div className={styles.promocionesContainer}>
          <div className={styles.promocionesBlock}>
            <div className={styles.promocionesContent}>
              <h2 id="promociones-heading" className={styles.promocionesSectionTitle}>
                Promociones y Formas de Pago
              </h2>
              <p className={styles.promocionesBlockText}>
                Financiación con cuotas fijas, garantía incluida en todos los usados
                y múltiples formas de pago. Consultá las opciones para tu vehículo.
              </p>
              <a
                href={`https://wa.me/${USADOS_WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Quiero consultar sobre promociones y formas de pago para vehículos usados.")}`}
                className={styles.promocionesWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Consultar promociones por WhatsApp"
              >
                <svg
                  className={styles.promocionesWhatsappIcon}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>Consultar promociones</span>
              </a>
            </div>
            <div className={styles.promocionesImageWrap}>
              <picture>
                <source
                  media="(min-width: 769px)"
                  srcSet="https://res.cloudinary.com/drbeomhcu/image/upload/v1770655135/feria-usados-cuadredad_uzthsc.webp"
                />
                <source
                  media="(max-width: 768px)"
                  srcSet="https://res.cloudinary.com/drbeomhcu/image/upload/v1770655157/feria-usados-mobile_b6kbni.webp"
                />
                <img
                  src="https://res.cloudinary.com/drbeomhcu/image/upload/v1770655157/feria-usados-mobile_b6kbni.webp"
                  alt="Feria de usados Indiana Peugeot — promociones y formas de pago"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className={styles.promocionesImage}
                />
              </picture>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 2: Título + Botón "Ver todos" + Carrusel (abajo) */}
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
    </div>
  );
}
