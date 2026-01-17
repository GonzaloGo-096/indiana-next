import styles from "./loading.module.css";

/**
 * Loading State Global
 * 
 * Se muestra mientras Next.js está cargando la página inicial.
 * Para loading states específicos por ruta, crear loading.jsx en cada carpeta.
 */
export default function Loading() {
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

