import styles from "../../loading.module.css";

/**
 * Loading State para página de detalle de vehículo
 * 
 * Se muestra mientras Next.js está cargando la página del vehículo.
 * Usa spinner en lugar de skeleton.
 */
export default function Loading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      <p className={styles.text}>Cargando vehículo...</p>
    </div>
  );
}

