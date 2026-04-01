import styles from "../../loading.module.css";

/**
 * Loading State para /usados/[slug]
 *
 * Usa el mismo spinner compartido que el resto del sitio.
 * El contenedor llena el viewport (menos la Nav) para que el footer
 * no suba durante la carga y luego baje al aparecer el contenido.
 */
export default function VehicleDetailLoading() {
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
