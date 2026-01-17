import Link from "next/link";
import styles from "./UsadosSection.module.css";

/**
 * UsadosSection - Sección de Usados Multimarca en la página de inicio
 * 
 * Diseño: Fondo claro, título, texto y botón que lleva a /usados
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
          <h2 id="usados-title" className={styles.title}>
            USADOS MULTIMARCA
          </h2>
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

