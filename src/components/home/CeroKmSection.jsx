import Link from "next/link";
import Image from "next/image";
import { getAllModelos } from "../../data/modelos";
import { staticImages } from "../../config/cloudinaryStaticImages";
import { VehiculosCarouselClient } from "../0km/VehiculosCarouselClient";
import styles from "./CeroKmSection.module.css";

const UTILITARIOS_KEYS = ["partner", "expert", "boxer"];
const MAX_CARDS_HOME = 6;

/**
 * CeroKmSection - Sección de Peugeot 0km en la página de inicio
 *
 * Incluye carrusel de hasta 6 modelos 0km (solo vehículos, sin utilitarios)
 *
 * @author Indiana Peugeot
 * @version 3.0.0 - Carrusel de modelos 0km
 */
export function CeroKmSection() {
  const allModelos = getAllModelos();
  const lower = (s) => (s || "").toLowerCase();
  const vehiculos = allModelos.filter(
    (m) => !UTILITARIOS_KEYS.includes(lower(m.slug))
  );

  const vehiculosCards = vehiculos.slice(0, MAX_CARDS_HOME).map((modelo) => {
    const staticImage = staticImages.ceroKm.modelos[modelo.slug];
    return {
      key: modelo.slug,
      src: staticImage?.src || modelo.heroImage?.url || "",
      alt: staticImage?.alt || modelo.heroImage?.alt || modelo.nombre,
      titulo: staticImage?.titulo || modelo.nombre,
      slug: modelo.slug,
    };
  });

  return (
    <section className={styles.section} aria-labelledby="cero-km-title">
      <div className="container">
        <div className={styles.content}>
          <div className={styles.titleBlock}>
            <Image
              src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
              alt="Logo Peugeot"
              width={96}
              height={96}
              className={styles.titleLogo}
              loading="lazy"
              quality={90}
            />
            <h2 id="cero-km-title" className={styles.title}>
              PEUGEOT <span className={styles.titleSeparator}>|</span> 0KM
            </h2>
          </div>
          <p className={styles.description}>
            Con 15 años de experiencia, Indiana Peugeot es tu concesionaria oficial en Tucumán. Gama completa de modelos 0km, garantía oficial Peugeot y opciones de financiación.
          </p>
          {vehiculosCards.length > 0 && (
            <div className={styles.carouselSlot}>
              <VehiculosCarouselClient cards={vehiculosCards} variant="dark" compact />
            </div>
          )}
          <div className={styles.buttonsContainer}>
            <Link href="/0km" className={styles.button}>
              Ver modelos 0km
            </Link>
            <Link href="/planes" className={styles.button}>
              Ver planes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

