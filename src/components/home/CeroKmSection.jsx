import Link from "next/link";
import Image from "next/image";
import { getAllModelos } from "../../data/modelos";
import { staticImages } from "../../config/cloudinaryStaticImages";
import { VehiculosCarouselClient } from "../0km/VehiculosCarouselClient";
import styles from "./CeroKmSection.module.css";

const SLUG_UTILITARIOS = new Set(["partner", "expert", "boxer"]);

function slugLower(slug) {
  return (slug || "").toLowerCase();
}

function modeloToCard(modelo) {
  const staticImage = staticImages.ceroKm.modelos[modelo.slug];
  return {
    key: modelo.slug,
    src: staticImage?.src || modelo.heroImage?.url || "",
    alt: staticImage?.alt || modelo.heroImage?.alt || modelo.nombre,
    titulo: staticImage?.titulo || modelo.nombre,
    slug: modelo.slug,
  };
}

/** Vehículos de pasajeros primero, utilitarios al final (un solo carrusel continuo). */
function buildCarouselCards(modelos) {
  const vehiculos = modelos.filter((m) => !SLUG_UTILITARIOS.has(slugLower(m.slug)));
  const utilitarios = modelos.filter((m) => SLUG_UTILITARIOS.has(slugLower(m.slug)));
  return [...vehiculos, ...utilitarios].map(modeloToCard);
}

/**
 * Sección Peugeot 0 km en la página de inicio (carrusel + CTAs).
 */
export function CeroKmSection() {
  const cards = buildCarouselCards(getAllModelos());

  return (
    <section className={styles.section} aria-labelledby="cero-km-title">
      <div className={styles.sectionInner}>
        <div className={styles.content}>
          <div className={styles.titleBlock}>
            <div className={styles.titleLogoWrap}>
              <Image
                src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
                alt="Peugeot"
                width={128}
                height={128}
                className={styles.titleLogoImg}
                loading="lazy"
                quality={90}
              />
            </div>
            <h2 id="cero-km-title" className={styles.title}>
              PEUGEOT <span className={styles.titleSeparator}>|</span> 0KM
            </h2>
          </div>

          <p className={styles.description}>
            Con 60 años de experiencia, Indiana Peugeot es tu concesionaria oficial en
            Tucumán. Gama completa de modelos 0km, garantía oficial Peugeot y opciones de
            financiación.
          </p>

          {cards.length > 0 && (
            <div className={styles.carouselSlot}>
              <VehiculosCarouselClient
                cards={cards}
                variant="dark"
                compact
                fillParentWidth
                softSurface
              />
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
