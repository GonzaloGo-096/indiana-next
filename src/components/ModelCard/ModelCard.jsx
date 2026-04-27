/**
 * ModelCard - Card de modelo 0km con imagen y título
 * 
 * Diseño: Card con imagen del modelo, hover sutil
 * Mobile-first, fondo blanco, borde sutil
 * 
 * @author Indiana Usados
 * @version 2.1.0 - Optimizado con React.memo para mejor performance
 */

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./ModelCard.module.css";

/**
 * Componente ModelCard
 * Optimizado con React.memo para evitar re-renders innecesarios en listas
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.src - URL de la imagen
 * @param {string} props.alt - Texto alternativo
 * @param {string} props.titulo - Nombre del modelo
 * @param {string} props.slug - Slug para la URL (ej: "208", "2008")
 * @param {string[]} props.versionLabels - Versiones a mostrar en columna
 * @param {boolean} props.hasPlanes - Si el modelo tiene planes disponibles
 * @param {boolean} props.showActionButtons - Mostrar CTAs debajo del auto
 * @param {boolean} props.okmShowcase - Estilos de presentación exclusivos para /0km
 * @param {boolean} props.compact - Versión más pequeña (para home)
 * @param {boolean} props.softSurface - Sobre fondo oscuro: menos contraste (off-white, sombra suave)
 * @param {boolean} props.frameless - Sin caja de card (solo imagen + título; pensado para home sobre degradé oscuro)
 */
function ModelCard({
  src,
  alt,
  titulo,
  slug,
  versionLabels = [],
  hasPlanes = false,
  showActionButtons = false,
  okmShowcase = false,
  compact = false,
  softSurface = false,
  frameless = false,
}) {
  const classNames = [
    styles.card,
    okmShowcase && styles.okmShowcase,
    compact && styles.compact,
    softSurface && styles.softSurface,
    frameless && styles.frameless,
  ]
    .filter(Boolean)
    .join(" ");
  const isUtilitario = ["partner", "expert", "boxer"].includes(String(slug).toLowerCase());

  const cardInner = (
    <>
      <div className={styles.imageContainer}>
        {versionLabels.length > 0 && (
          <div
            className={`absolute z-20 flex flex-col gap-1.5 sm:gap-2 ${
              isUtilitario
                ? "left-0 top-2 sm:left-1 sm:top-3"
                : "left-4 top-3 sm:left-5 sm:top-4"
            }`}
          >
            {versionLabels.map((version) => {
              const isGt = String(version).trim().toUpperCase() === "GT";
              return (
              <span
                key={`${slug}-${version}`}
                className={`font-semibold uppercase tracking-[0.045em] drop-shadow-[0_1px_2px_rgba(248,250,252,0.55)] ${isGt ? "text-[0.92rem] text-red-500/88 sm:text-[1.04rem]" : "text-[0.84rem] text-slate-700/88 sm:text-[0.96rem]"}`}
              >
                {version}
              </span>
              );
            })}
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          width={400}
          height={300}
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 300px"
          quality={80}
          loading="lazy"
        />
      </div>

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <Image
            src="/assets/logos/logos-peugeot/Peugeot_logo_PNG8.webp"
            alt="Logo Peugeot"
            width={44}
            height={44}
            className={styles.peugeotLogo}
          />
          <h3 className={styles.title}>{titulo}</h3>
        </div>
      </div>
      {showActionButtons && (
        <div className={styles.actionsRow}>
          <Link href={`/0km/${slug}`} className={styles.actionButton}>
            Ver modelo
          </Link>
          {hasPlanes && (
            <Link href="/planes" className={`${styles.actionButton} ${styles.actionButtonLight}`}>
              Ver planes
            </Link>
          )}
        </div>
      )}
    </>
  );

  if (showActionButtons) {
    return (
      <article className={classNames} data-slug={slug}>
        {cardInner}
      </article>
    );
  }

  return (
    <Link href={`/0km/${slug}`} className={classNames} data-slug={slug}>
      {cardInner}
    </Link>
  );
}

// Memoizar componente para evitar re-renders innecesarios en listas
export default memo(ModelCard);

