import Link from "next/link";
import Image from "next/image";
import styles from "./UsadosSection.module.css";

/**
 * UsadosSection - Sección de Usados Multimarca en la página de inicio
 * 
 * Diseño: Fondo claro, logo Indiana (chico negro), título, texto y botón que lleva a /usados.
 * Misma estructura que CeroKmSection (logo arriba del título).
 * 
 * ✅ Server Component: Sin interactividad, solo renderizado estático
 * ✅ Prefetch: Next.js maneja prefetch automático de <Link>
 * 
 * @author Indiana Peugeot
 * @version 2.0.0 - Convertido a Server Component
 */
export function UsadosSection() {
  return (
    <section
      className={styles.section}
      aria-labelledby="usados-title"
    >
      <div className="container">
        <div className={styles.content}>
          <div className={styles.titleBlock}>
            <Image
              src="/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp"
              alt="Logo Indiana"
              width={128}
              height={128}
              className={styles.titleLogo}
              loading="lazy"
              quality={90}
            />
            <h2 id="usados-title" className={styles.title}>
              USADOS MULTIMARCA
            </h2>
          </div>
          <p className={styles.description}>
            Amplia selección de vehículos usados de todas las marcas. Garantía
            incluida, financiación disponible y servicio postventa profesional.
            Encontrá el auto que buscás al mejor precio.
          </p>
          <Link href="/usados" className={styles.button}>
            Ver todos los usados
          </Link>
        </div>
      </div>
    </section>
  );
}

