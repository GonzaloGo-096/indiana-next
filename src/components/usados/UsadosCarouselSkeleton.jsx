/**
 * Placeholder del carrusel de usados mientras se resuelve el fetch en el server.
 *
 * Sin "use client" a propósito: se renderiza como fallback de <Suspense> desde
 * un Server Component y no necesita interactividad, así que no suma JS al bundle.
 *
 * Reusa las clases de skeleton que ya vivían en UsadosCarousel.module.css. La
 * tarjeta estaba definida dentro de UsadosCarousel.jsx pero no la usaba nadie:
 * los estilos existían y el markup era código muerto.
 *
 * Importa reservar la altura: si la sección apareciera de golpe, el contenido
 * de abajo saltaría (CLS).
 */

import styles from "./UsadosCarousel.module.css";

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonContainer1}>
          <div className={styles.skeletonRow1}>
            <div className={styles.skeletonMarca} />
            <div className={styles.skeletonSeparator} />
            <div className={styles.skeletonModelo} />
          </div>
          <div className={styles.skeletonRow3}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonDataItem}>
                <div className={styles.skeletonDataLabel} />
                <div className={styles.skeletonDataValue} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.skeletonPriceContainer}>
          <div className={styles.skeletonPriceLabel} />
          <div className={styles.skeletonPriceValue} />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {number} count - Cuántas tarjetas dibujar. 4 es lo que entra en
 *   desktop en el inicio; en pantallas chicas las de más quedan fuera del
 *   scroll horizontal, igual que las reales.
 */
export function UsadosCarouselSkeleton({ count = 4 }) {
  return (
    <div
      className={`${styles.carouselWrapper} ${styles.carouselHomeDesktopFour}`}
      aria-hidden="true"
    >
      <div className={styles.carouselContainer}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default UsadosCarouselSkeleton;
