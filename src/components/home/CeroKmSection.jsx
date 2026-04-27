import Link from "next/link";
import Image from "next/image";
import { getAllModelos, getHomeCeroKmCardImage } from "../../data/modelos";
import { VehiculosCarouselClient } from "../0km/VehiculosCarouselClient";
import styles from "./CeroKmSection.module.css";
import cta from "./HomeSectionCtas.module.css";

const SLUG_UTILITARIOS = new Set(["partner", "expert", "boxer"]);

function slugLower(slug) {
  return (slug || "").toLowerCase();
}

function modeloToCard(modelo) {
  const img = getHomeCeroKmCardImage(modelo);
  return {
    key: modelo.slug,
    src: img?.url || "",
    alt: img?.alt || modelo.nombre,
    titulo: modelo.nombre,
    slug: modelo.slug,
  };
}

/** Vehículos: 208 primero; utilitarios al final (un solo carrusel continuo). */
function buildCarouselCards(modelos) {
  const vehiculos = modelos.filter((m) => !SLUG_UTILITARIOS.has(slugLower(m.slug)));
  const utilitarios = modelos.filter((m) => SLUG_UTILITARIOS.has(slugLower(m.slug)));
  const idx208 = vehiculos.findIndex((m) => slugLower(m.slug) === "208");
  const orderedVeh =
    idx208 <= 0
      ? [...vehiculos]
      : [vehiculos[idx208], ...vehiculos.filter((_, i) => i !== idx208)];
  return [...orderedVeh, ...utilitarios].map(modeloToCard);
}

/**
 * Sección Peugeot 0 km en la página de inicio (carrusel + CTAs).
 */
export function CeroKmSection() {
  const cards = buildCarouselCards(getAllModelos());

  return (
    <section
      id="home-0km"
      className={styles.section}
      aria-labelledby="cero-km-title"
    >
      <div className={styles.sectionInner}>
        <div className={styles.content}>
          <div className={styles.heroIntro}>
            <div className={styles.heroShield}>
              <Image
                src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
                alt=""
                width={128}
                height={128}
                className={styles.heroShieldImg}
                loading="lazy"
                quality={90}
              />
            </div>
            <div className={styles.heroCopy}>
              <h2 id="cero-km-title" className={styles.heroTitle}>
                <span className={styles.heroTitleRow}>
                  <span className={styles.heroTitleBrand}>Peugeot</span>
                  <span className={styles.heroTitleTail}>
                    <span className={styles.heroTitleKicker}>0 km</span>
                    <span className={styles.heroTitleRule} aria-hidden="true" />
                  </span>
                </span>
              </h2>
              <p className={styles.heroSubtitle}>
                <strong className={styles.heroLead}>Concesionario oficial Peugeot</strong> en Tucumán.{" "}
                <strong className={styles.heroLead}>Más de 60 años</strong> de trayectoria.
              </p>
            </div>
          </div>
        </div>
      </div>

      {cards.length > 0 && (
        <div className={styles.carouselFullBleed}>
          <VehiculosCarouselClient
            cards={cards}
            variant="default"
            compact
            fillParentWidth
            softSurface
            frameless
            bleedEdges
          />
        </div>
      )}

      <div className={styles.sectionInner}>
        <div className={styles.content}>
          <div className={`${cta.buttonsContainer} ${styles.ceroCtaPull}`}>
            <Link href="/0km" className={cta.button}>
              Ver modelos 0km
            </Link>
            <Link href="/planes" className={cta.button}>
              Ver planes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
