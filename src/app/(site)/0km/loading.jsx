import styles from "@/app/loading.module.css";

/**
 * Loading State para /0km
 *
 * Se muestra mientras Next.js está generando la página de listado de modelos 0km.
 * Usa el mismo spinner que el resto del sitio.
 */
export default function CeroKilometrosLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      <p className={styles.text}>Cargando...</p>
    </div>
  );
}
