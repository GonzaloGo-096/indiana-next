import Image from "next/image";
import styles from "./Hero.module.css";
import { staticImages } from "../../config/cloudinaryStaticImages";
import cta from "../home/HomeSectionCtas.module.css";

const Hero = ({ className }) => {
  return (
    <section
      className={[styles.hero, className].filter(Boolean).join(" ")}
      aria-label="Sección principal"
    >
      <div className={styles.backgroundPicture}>

        {/*
          sizes="(min-width: 769px) 100vw, 1px"
          En mobile evalúa "1px" → next/image elige el srcset más chico (16w, ~300 bytes).
          En desktop evalúa "100vw" → descarga la imagen completa con priority.
        */}
        <Image
          src={staticImages.home.heroDesktop.src}
          alt={staticImages.home.heroDesktop.alt}
          fill
          priority
          quality={75}
          sizes="(min-width: 769px) 100vw, 1px"
          className={`${styles.backgroundImage} ${styles.backgroundImageDesktop}`}
        />

        {/*
          sizes="(max-width: 768px) 100vw, 1px"
          En desktop evalúa "1px" → next/image elige el srcset más chico (16w, ~300 bytes).
          En mobile evalúa "100vw" → descarga la imagen completa con priority.
        */}
        <Image
          src={staticImages.home.heroMobile.src}
          alt={staticImages.home.heroMobile.alt}
          fill
          priority
          quality={75}
          sizes="(max-width: 768px) 100vw, 1px"
          className={`${styles.backgroundImage} ${styles.backgroundImageMobile}`}
        />

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
  );
};

export default Hero;
