import Link from "next/link";
import { HomeUsadosCarousel } from "./HomeUsadosCarousel";
import styles from "./UsadosSection.module.css";
import cta from "./HomeSectionCtas.module.css";

/**
 * UsadosSection - Sección de Usados Multimarca en la página de inicio
 *
 * Incluye carrusel de hasta 6 vehículos usados entre descripción y CTA.
 *
 * @author Indiana Peugeot
 * @version 3.0.0 - Carrusel de usados
 */
export function UsadosSection({ vehicles = [] }) {
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
          {vehicles.length > 0 && (
            <div className={styles.carouselSlot}>
              <HomeUsadosCarousel vehicles={vehicles} />
            </div>
          )}
          <div className={cta.buttonsContainer}>
            <Link href="/usados/vehiculos" className={`${cta.button} ${cta.buttonWhite}`}>
              Ver todos los usados
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
