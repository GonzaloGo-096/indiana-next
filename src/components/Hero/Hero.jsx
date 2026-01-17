"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";
import { staticImages } from "../../config/cloudinaryStaticImages";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in al cargar
  useEffect(() => {
    // Pequeño delay para que la animación se note
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={`${styles.hero} ${isVisible ? styles.visible : ""}`}
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

