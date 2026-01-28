import Image from "next/image";
import styles from "./Hero.module.css";
import { staticImages } from "../../config/cloudinaryStaticImages";

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
const Hero = () => {
  return (
    <section
      className={styles.hero}
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
          sizes="100vw"
          className={`${styles.backgroundImage} ${styles.backgroundImageDesktop}`}
        />
        <Image
          src={staticImages.home.heroMobile.src}
          alt={staticImages.home.heroMobile.alt}
          fill
          priority
          quality={85}
          sizes="100vw"
          className={`${styles.backgroundImage} ${styles.backgroundImageMobile}`}
        />
      </div>

      {/* Overlay oscuro */}
      <div className={styles.overlay} />

      {/* Contenido */}
      <div className={styles.content}>
        <h1 className={styles.title}>
          Vehículos seleccionados para cada necesidad
        </h1>

        <p className={styles.subtitle}>
          Financiación a medida y asesoramiento profesional
        </p>
      </div>
    </section>
  );
};

export default Hero;

