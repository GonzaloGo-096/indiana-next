import styles from "./0km-loading.module.css";

/**
 * Loading State para /0km
 * 
 * Se muestra mientras Next.js está generando la página de listado de modelos 0km.
 */
export default function CeroKilometrosLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonSubtitle}></div>
      </div>
      <div className={styles.carousel}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.skeletonImage}></div>
            <div className={styles.skeletonText}></div>
            <div className={styles.skeletonButton}></div>
          </div>
        ))}
      </div>
    </div>
  );
}



