import Link from "next/link";
import Image from "next/image";
import styles from "./CeroKmSection.module.css";

/**
 * CeroKmSection - Sección de Peugeot 0km en la página de inicio
 * 
 * Diseño: Fondo negro, título y texto, link a /0km
 * 
 * ✅ Server Component: Sin interactividad, solo renderizado estático
 * 
 * @author Indiana Peugeot
 * @version 2.0.0 - Convertido a Server Component
 */
export function CeroKmSection() {
  return (
    <section className={styles.section} aria-labelledby="cero-km-title">
      <div className="container">
        <div className={styles.content}>
          <h2 id="cero-km-title" className={styles.title}>
            <Image
              src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
              alt="Logo Peugeot"
              width={60}
              height={60}
              className={styles.titleLogo}
              loading="lazy"
              quality={90}
            />
            PEUGEOT 0KM
          </h2>
          <p className={styles.description}>
            Descubrí la gama completa de vehículos Peugeot 0km. Modelos nuevos
            con garantía oficial, tecnología de vanguardia y las mejores
            opciones de financiación.
          </p>
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

