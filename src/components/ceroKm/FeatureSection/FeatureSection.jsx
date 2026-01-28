import { memo } from "react";
import Image from "next/image";
import styles from "./FeatureSection.module.css";

/**
 * FeatureSection - Sección de características destacadas
 * 
 * ✅ Server Component - Solo renderiza contenido estático
 * ✅ OPTIMIZADO: Memoizado para evitar re-renders innecesarios
 * 
 * Mobile-first:
 * - Mobile: altura automática, sin centrado vertical
 * - Desktop: altura escénica con contenido centrado
 * 
 * @param {Object} props
 * @param {Object} props.feature - Objeto con datos de la feature
 * @param {string} props.feature.title - Título de la característica
 * @param {string} props.feature.description - Descripción
 * @param {Object} props.feature.images - { mobile, desktop } con URLs completas
 * @param {Array} props.feature.items - Array de items (opcional)
 * @param {boolean} props.reverse - Invertir orden imagen/texto en desktop
 * @param {string} props.modeloNombre - Nombre del modelo (ej: '208')
 * @param {boolean} props.isLast - Indica si es la última FeatureSection
 */
export const FeatureSection = memo(function FeatureSection({
  feature,
  reverse = false,
  modeloNombre = "",
  isLast = false,
}) {
  if (!feature) return null;

  const { title, description, images, items } = feature;

  // Verificar si es la sección de Realidad Aumentada del 208 o 2008
  const isRealidadAumentada =
    (modeloNombre === "208" || modeloNombre === "2008") &&
    title === "REALIDAD AUMENTADA 3D";

  return (
    <section
      className={`${styles.section} ${reverse ? styles.reverse : ""} ${
        isLast ? styles.isLast : ""
      }`}
    >
      <div className={styles.container}>
        {/* Imagen - URLs directas optimizadas (mobile y desktop separados) */}
        {(images?.mobile || images?.desktop) && (
          <div className={styles.imageWrapper}>
            {images?.mobile && (
              <Image
                src={images.mobile}
                alt={title}
                width={800}
                height={600}
                className={`${styles.image} ${styles.imageMobile}`}
                sizes="(max-width: 768px) 100vw, 60vw"
                quality={80}
                loading="lazy"
              />
            )}
            {images?.desktop && (
              <Image
                src={images.desktop}
                alt={title}
                width={1200}
                height={800}
                className={`${styles.image} ${styles.imageDesktop}`}
                sizes="(max-width: 768px) 100vw, 60vw"
                quality={85}
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Contenido */}
        <div className={styles.content}>
          <h2 className={styles.title}>
            {title === "REALIDAD AUMENTADA 3D" ? (
              <>
                REALIDAD AUMENTADA{" "}
                <span className={styles.titleDivider}>|</span> 3D
              </>
            ) : (
              title
            )}
          </h2>

          {/* Renderizar ambos contenidos y usar CSS para mostrar/ocultar según breakpoint */}
          {isRealidadAumentada ? (
            <>
              {/* Contenido 3D (solo visible en mobile) */}
              <div className={styles.threeDContent}>
                <h3 className={styles.threeDTitle}>
                  CONOCÉ EL {modeloNombre} EN 3D
                </h3>
                <p className={styles.threeDDescription}>
                  Una experiencia inmersiva en 3D y realidad aumentada para ver
                  el auto desde todos los ángulos.
                </p>
                <a
                  href={`https://mtr.center/stellantis-argentina/peugeot-${modeloNombre.toLowerCase()}/`}
                  className={styles.threeDButton}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Explorar el ${modeloNombre} en 3D y realidad aumentada`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={styles.threeDIcon}
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  <span>Explorar en 3D</span>
                </a>
              </div>
              {/* Contenido normal (solo visible en desktop) */}
              <div className={styles.normalContent}>
                {description && (
                  <p className={styles.description}>{description}</p>
                )}
                {items && items.length > 0 && (
                  <ul className={styles.itemsList}>
                {items.map((item, index) => (
                  <li 
                    key={`${feature.id}-item-${index}-${item.slice(0, 20).replace(/\s/g, '-')}`} 
                    className={styles.item}
                  >
                    {item}
                  </li>
                ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <>
              {description && (
                <p className={styles.description}>{description}</p>
              )}
              {items && items.length > 0 && (
                <ul className={styles.itemsList}>
                {items.map((item, index) => (
                  <li 
                    key={`${feature.id}-item-${index}-${item.slice(0, 20).replace(/\s/g, '-')}`} 
                    className={styles.item}
                  >
                    {item}
                  </li>
                ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // ✅ Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.feature?.id === nextProps.feature?.id &&
    prevProps.reverse === nextProps.reverse &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.modeloNombre === nextProps.modeloNombre
  );
});

FeatureSection.displayName = "FeatureSection";

export default FeatureSection;

