import styles from "./0km-detalle-loading.module.css";

/**
 * Loading State para /0km/[autoSlug]
 * 
 * Se muestra mientras Next.js está generando la página de detalle del modelo.
 */
export default function ModeloDetalleLoading() {
  return (
    <div className={styles.container}>
      {/* Hero skeleton */}
      <div className={styles.hero}>
        <div className={styles.skeletonHeroImage}></div>
      </div>

      {/* Header skeleton */}
      <div className={styles.header}>
        <div className={styles.skeletonTitle}></div>
        <div className={styles.skeletonSubtitle}></div>
      </div>

      {/* Content skeleton */}
      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <div className={styles.skeletonImage}></div>
          <div className={styles.skeletonColorSelector}></div>
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.skeletonText}></div>
          <div className={styles.skeletonText}></div>
          <div className={styles.skeletonList}></div>
        </div>
      </div>
    </div>
  );
}


