import styles from "../../../loading.module.css";

/**
 * Loading state para /usados/vehiculos
 *
 * Next.js lo muestra automáticamente mientras el Server Component
 * hace el fetch inicial (antes de que lleguen los datos del backend).
 * Usa el spinner compartido del resto del sitio para consistencia.
 */
export default function VehiculosLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      <p className={styles.text}>Cargando vehículos...</p>
    </div>
  );
}
