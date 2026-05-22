import styles from "./Hero.module.css";
import { staticImages } from "../../config/cloudinaryStaticImages";
import { cl } from "../../lib/cloudinary";
import cta from "../home/HomeSectionCtas.module.css";

/**
 * Hero - Sección principal de la página de inicio.
 *
 * Estrategia de imagen:
 * - <picture> con <source media> garantiza que el navegador descargue
 *   UNA SOLA imagen según el viewport (mobile O desktop, nunca los dos).
 * - <link rel="preload" media> con imageSrcSet instruye al preload scanner
 *   a iniciar la descarga antes de que el parser llegue a la imagen.
 *   React 19 hoistea automáticamente estos <link> al <head>.
 * - URLs Cloudinary con f_auto,q_auto:eco,w_X → AVIF/WebP al tamaño real
 *   directamente desde el CDN de Cloudinary, sin pasar por /_next/image.
 *
 * Antes había dos <Image priority> alternados por CSS display:none/block,
 * lo que provocaba que el navegador descargara AMBAS imágenes en todos
 * los viewports (el preload no respeta display:none).
 */

const MOBILE_WIDTHS = [640, 828, 1080];
const DESKTOP_WIDTHS = [1280, 1920, 2560];

function buildSrcSet(src, widths) {
  return widths
    .map((w) => `${cl(src, { w })} ${w}w`)
    .join(", ");
}

const Hero = ({ className }) => {
  const mobile = staticImages.home.heroMobile;
  const desktop = staticImages.home.heroDesktop;

  const mobileSrcSet = buildSrcSet(mobile.src, MOBILE_WIDTHS);
  const desktopSrcSet = buildSrcSet(desktop.src, DESKTOP_WIDTHS);

  // Fallback src para el <img>: imagen mobile optimizada al tamaño más común
  const mobileFallback = cl(mobile.src, { w: 828 });

  return (
    <>
      {/*
        Dos preloads con media: el navegador activa solo el que matchea el viewport.
        fetchPriority="high" asegura que compite con el LCP en el preload scanner.
      */}
      <link
        rel="preload"
        as="image"
        imageSrcSet={mobileSrcSet}
        imageSizes="100vw"
        media="(max-width: 768px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        imageSrcSet={desktopSrcSet}
        imageSizes="100vw"
        media="(min-width: 769px)"
        fetchPriority="high"
      />

      <section
        className={[styles.hero, className].filter(Boolean).join(" ")}
        aria-label="Sección principal"
      >
        <div className={styles.backgroundPicture}>
          <picture>
            {/* En desktop (≥769px) usa la imagen horizontal */}
            <source
              media="(min-width: 769px)"
              srcSet={desktopSrcSet}
              sizes="100vw"
            />
            {/*
              Fallback: mobile. El <img> es el candidato al LCP.
              width/height evitan CLS mientras la imagen carga.
            */}
            <img
              src={mobileFallback}
              srcSet={mobileSrcSet}
              sizes="100vw"
              alt={mobile.alt}
              className={styles.backgroundImage}
              fetchPriority="high"
              decoding="async"
              width={1920}
              height={1080}
            />
          </picture>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>
            Vehículos seleccionados para cada necesidad
          </h1>

          <p className={styles.subtitle}>
            Financiación a medida y asesoramiento profesional
          </p>

          <div className={styles.heroCtas} role="navigation" aria-label="Ir a secciones">
            <a
              href="#home-0km"
              className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline} ${styles.heroCtaButton}`}
            >
              Peugeot 0 km
            </a>
            <a
              href="#home-usados"
              className={`${cta.button} ${cta.buttonOnDark} ${cta.buttonInline} ${styles.heroCtaButton}`}
            >
              Usados
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
