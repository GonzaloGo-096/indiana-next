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
import cta from "@/components/home/HomeSectionCtas.module.css";
import { createLogger } from "@/lib/logger";
import styles from "./usados.module.css";

const log = createLogger("usados:promos");

/**
 * Metadata para SEO
 */
export async function generateMetadata() {
  const title = "Autos Usados en Tucumán";
  const description =
    "Explorá vehículos usados seleccionados en Tucumán. Consultá disponibilidad, características y contacto comercial con Peugeot Indiana.";

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
        title: `${title} | Peugeot Indiana`,
        description,
        url: canonical,
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: ogImage
          ? [
              {
                url: ogImage,
                alt: "Autos Usados en Tucumán - Peugeot Indiana",
                width: 1200,
                height: 630,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Peugeot Indiana`,
        description,
        images: ogImage ? [ogImage] : [],
      },
      alternates: {
        canonical,
      },
    };
  } catch (err) {
    log.error("generateMetadata falló, usando fallback:", err?.message || err);
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
// Sin `export const revalidate`: la frescura la gobiernan los tags.
//
// Antes habia `revalidate = 120`, que hacia re-renderizar la pagina cada 2
// minutos sobre datos que el Data Cache retiene 6 horas (vehiclesApi.server
// fetchea con revalidate 21600 + tags). O sea ~30 ejecuciones por hora para
// producir exactamente el mismo HTML.
//
// Lo que realmente actualiza esto es revalidateTag('vehicles-list'), que
// dispara el admin al guardar un vehiculo. Eso invalida datos y pagina juntos.
//
// Condicion para que esto sea seguro: que se sepa cuando esa revalidacion
// falla. Antes fallaba en silencio; desde el Bloque 1 queda registrada en
// revalidatePublicCache.

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
    // Misma clase de falla que tenía la home: si esto se traga en silencio,
    // la página renderiza sin vehículos y nadie se entera. El fallback a lista
    // vacía se mantiene (la página tiene más contenido que el carrusel), pero
    // ahora el error queda registrado y llega a telemetría.
    log.error("Error trayendo vehículos, la sección queda vacía:", error?.message || error);
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
        className={`${styles.vehiclesSection} w-full min-w-0 pt-12 pb-10 md:pt-16 md:pb-14 lg:pt-20 lg:pb-16`}
        aria-labelledby="usados-vehiculos-titulo"
      >
        <div className={`${styles.vehiclesContainer} w-full min-w-0`}>
          <div
            className={`${styles.vehiclesStack} flex w-full min-w-0 flex-col gap-2 md:gap-3 lg:gap-4`}
          >
            <div
              className={`${styles.vehiclesHeader} w-full min-w-0 gap-x-4 gap-y-3`}
            >
              <h1
                id="usados-vehiculos-titulo"
                className={`${styles.vehiclesTitle} text-balance text-3xl sm:text-4xl md:text-5xl`}
              >
                Vehículos Usados
              </h1>
              <span className={styles.titleSep} aria-hidden="true" />
              <div className={styles.vehiclesHeaderRest}>
                <Link
                  href="/usados/vehiculos"
                  className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline} ${cta.buttonCompact}`}
                >
                  Ver todos
                </Link>
              </div>
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
