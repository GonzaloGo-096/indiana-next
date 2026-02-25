/**
 * HeroCareers - Hero section de la página Trabaja con nosotros
 *
 * @author Indiana Peugeot
 */

import Image from "next/image";
import { staticImages } from "@/config/cloudinaryStaticImages";
import styles from "./HeroCareers.module.css";

const HeroCareers = () => {
  const hero = staticImages.careers?.hero ?? staticImages.postventa.hero;

  return (
    <section className={styles.hero} aria-labelledby="careers-hero-title">
      <div className="container">
        <div className={styles.heroBanner}>
          <Image
            src={hero.src}
            alt={hero.alt}
            width={1200}
            height={400}
            className={styles.heroImage}
            priority
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          />
          <div className={styles.heroContent}>
            <h1 id="careers-hero-title" className={styles.heroTitle}>
              Trabajá con nosotros
            </h1>
            <p className={styles.heroDescription}>
              Sumate a Indiana Peugeot: un equipo profesional donde tu talento
              hace la diferencia. Buscamos personas comprometidas, con ganas de
              crecer y aportar valor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCareers;
