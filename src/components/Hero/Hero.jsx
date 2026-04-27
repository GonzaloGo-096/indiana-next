import Image from "next/image";
import styles from "./Hero.module.css";
import { staticImages } from "../../config/cloudinaryStaticImages";
import cta from "../home/HomeSectionCtas.module.css";

/**
 * Hero - Sección principal de la página de inicio
 *
 * ✅ OPTIMIZADO: Convertido a Server Component
 * ✅ Animación con CSS puro (sin JavaScript)
 * ✅ Mejor performance: Sin hidratación innecesaria
 *
 * @author Indiana Peugeot
 * @version 2.0.0 - Server Component optimizado
 */
const Hero = ({ className }) => {
  return (
    <section
      className={[styles.hero, className].filter(Boolean).join(" ")}
      aria-label="Sección principal"
    >
      {/* Imagen de fondo responsive con next/image - Crítica para LCP */}
      <div className={styles.backgroundPicture}>
        <Image
          src={staticImages.home.heroDesktop.src}
          alt={staticImages.home.heroDesktop.alt}
          fill
          priority
          quality={85}
          sizes="(min-width: 769px) 100vw, 0vw"
          className={`${styles.backgroundImage} ${styles.backgroundImageDesktop}`}
        />
        <Image
          src={staticImages.home.heroMobile.src}
          alt={staticImages.home.heroMobile.alt}
          fill
          priority
          quality={85}
          sizes="(max-width: 768px) 100vw, 0vw"
          className={`${styles.backgroundImage} ${styles.backgroundImageMobile}`}
        />
      </div>

      {/* Contenido */}
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
  );
};

export default Hero;
