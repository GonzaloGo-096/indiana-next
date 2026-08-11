import styles from "@/app/loading.module.css";

/**
 * Loading State para /0km/[autoSlug]
 *
 * Se muestra mientras Next.js está generando la página de detalle del modelo.
 * Usa el mismo spinner que el resto del sitio.
 */
export default function ModeloDetalleLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      <p className={styles.text}>Cargando modelo...</p>
    </div>
  );
}
