import Link from "next/link";
import Image from "next/image";
import UsadosCarousel from "../usados/UsadosCarousel";
import styles from "./UsadosSection.module.css";

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
      className={styles.section}
      aria-labelledby="usados-title"
    >
      <div className="container">
        <div className={styles.content}>
          <div className={styles.titleBlock}>
            <Image
              src="/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp"
              alt="Logo Indiana"
              width={128}
              height={128}
              className={styles.titleLogo}
              loading="lazy"
              quality={90}
            />
            <h2 id="usados-title" className={styles.title}>
              USADOS MULTIMARCA
            </h2>
          </div>
          <p className={styles.description}>
            Amplia selección de vehículos usados de todas las marcas. Garantía
            incluida, financiación disponible. Encontrá el auto que buscás al mejor precio.
          </p>
          {vehicles.length > 0 && (
            <div className={styles.carouselSlot}>
              <UsadosCarousel vehicles={vehicles} compact viewportClip />
            </div>
          )}
          <div className={styles.buttonsContainer}>
            <Link href="/usados" className={styles.button}>
              Ver todos los usados
            </Link>
            <Link href="/usados#promociones" className={styles.button}>
              Ver promociones
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

