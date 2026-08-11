import { Suspense } from "react";
import Link from "next/link";
import { HomeUsadosCarouselServer } from "./HomeUsadosCarouselServer";
import { UsadosCarouselSkeleton } from "../usados/UsadosCarouselSkeleton";
import styles from "./UsadosSection.module.css";
import cta from "./HomeSectionCtas.module.css";

/**
 * UsadosSection - Sección de Usados Multimarca en la página de inicio
 *
 * Incluye carrusel de hasta 6 vehículos usados entre descripción y CTA.
 *
 * Server Component: el encabezado y los botones se pintan de inmediato y solo
 * el carrusel queda suspendido esperando al backend. Antes la sección recibía
 * los vehículos por props desde un componente cliente que los pedía con
 * useEffect; cuando ese pedido fallaba, la sección desaparecía en silencio.
 *
 * @author Indiana Peugeot
 * @version 4.0.0 - Fetch en server con Suspense
 */
export function UsadosSection() {
  return (
    <section
      id="home-usados"
      className={styles.section}
      aria-labelledby="usados-title"
    >
      <div className={styles.sectionInner}>
        <div className={styles.content}>
          <div className={styles.headerIntro}>
            {/* Misma familia que azul-solo (0 km); variante chica sin “INDIANA” arriba — mismo folder */}
            <div className={styles.headerLogo}>
              <span
                className={styles.headerLogoGradient}
                role="img"
                aria-label="Logo Indiana Usados"
              />
            </div>
            <div className={styles.headerCopy}>
              <h2 id="usados-title" className={styles.title}>
                <span className={styles.titleRow}>
                  <span className={styles.titleBrand}>Usados</span>
                  <span className={styles.titleTail}>
                    <span className={styles.titleKicker}>Multimarca</span>
                    <span className={styles.titleRule} aria-hidden="true" />
                  </span>
                </span>
              </h2>
              <p className={styles.description}>
                <strong className={styles.descriptionLead}>Usados seleccionados</strong> al mejor
                precio.{" "}
                <strong className={styles.descriptionLead}>
                  Con garantía, financiación y listos para retirar
                </strong>
                .
              </p>
            </div>
          </div>
          <div className={styles.carouselSlot}>
            <Suspense fallback={<UsadosCarouselSkeleton />}>
              <HomeUsadosCarouselServer />
            </Suspense>
          </div>
          <div className={cta.buttonsContainer}>
            <Link href="/usados/vehiculos" className={`${cta.button} ${cta.buttonWhite}`}>
              Ver modelos usados
            </Link>
            <Link href="/usados" className={`${cta.button} ${cta.buttonWhite}`}>
              Ver promociones
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
