/**
 * /usados - Página principal de usados (Server Component)
 *
 * ✅ ARQUITECTURA:
 * - Sección vehículos: título + "Ver todos" + carrusel debajo (inicio alineado con el título)
 * - Sección 2: Promociones y formas de pago
 *
 * @author Indiana Peugeot
 * @version 3.0.0 - Restructurada con carrusel
 */

import Link from "next/link";
import { tryAbsoluteUrl } from "../../../lib/site-url";
import { vehiclesService } from "../../../lib/services/vehiclesApi.server";
import { mapVehiclesPage } from "../../../lib/mappers/vehicleMapper";
import UsadosPageCarousel from "./UsadosPageCarousel";
import PromocionesCarousel from "./PromocionesCarousel";
import styles from "./usados.module.css";

/**
 * Metadata para SEO
 */
export async function generateMetadata() {
  const title = "Vehículos Usados Multimarca | Indiana Peugeot";
  const description =
    "Amplia selección de vehículos usados multimarca en Indiana Peugeot. Garantía incluida, financiación disponible y servicio postventa profesional.";

  try {
    const canonical = tryAbsoluteUrl("/usados") ?? "/usados";
    const ogImage =
      tryAbsoluteUrl(
        "/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"
      ) ?? null;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: ogImage
          ? [
              {
                url: ogImage,
                alt: "Vehículos Usados Multimarca - Indiana Peugeot",
                width: 1200,
                height: 630,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical,
      },
    };
  } catch (err) {
    console.error("[usados] generateMetadata:", err?.message || err);
    return {
      title,
      description,
      alternates: { canonical: "/usados" },
    };
  }
}

/**
 * ISR ligero: evita ejecutar el Server Component en cada visita (mejor TTFB que force-dynamic).
 * Los datos del carrusel pueden tardar hasta este intervalo en reflejar cambios del API.
 */
export const revalidate = 120;

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
    console.error("[UsadosPage] Error fetching vehicles:", error?.message || error);
    vehicles = [];
  }

  return (
    <div className={`${styles.page} w-full min-w-0 antialiased`}>
      <header
        id="promociones"
        className={`${styles.usadosHeader} w-full min-w-0 border-b border-neutral-100`}
        aria-label="Promociones usados"
      >
        <PromocionesCarousel />
      </header>

      <section
        className={`${styles.vehiclesSection} w-full min-w-0 pt-10 pb-8 md:pt-14 md:pb-10 lg:pt-16 lg:pb-12`}
        aria-labelledby="usados-vehiculos-titulo"
      >
        <div className={`${styles.vehiclesContainer} w-full min-w-0`}>
          <div
            className={`${styles.vehiclesStack} flex w-full min-w-0 flex-col gap-6 md:gap-8 lg:gap-10`}
          >
            <div
              className={`${styles.vehiclesHeader} w-full min-w-0 items-center justify-between gap-x-4 gap-y-3`}
            >
              <h1
                id="usados-vehiculos-titulo"
                className={`${styles.vehiclesTitle} min-w-0 flex-1 text-balance text-2xl sm:text-3xl md:text-4xl`}
              >
                Vehículos Usados
              </h1>
              <Link
                href="/usados/vehiculos"
                className={`${styles.verTodosButton} shrink-0 text-sm sm:text-base shadow-sm transition-shadow hover:shadow-md`}
              >
                Ver todos
              </Link>
            </div>
            <div className={`${styles.vehiclesCarouselSlot} w-full min-w-0`}>
              <UsadosPageCarousel vehicles={vehicles} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
