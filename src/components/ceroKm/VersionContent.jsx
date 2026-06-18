"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ColorSelector } from "./ColorSelector";
import styles from "./VersionContent.module.css";

const VersionTabs = dynamic(
  () => import("./VersionTabs").then((mod) => ({ default: mod.VersionTabs })),
  { ssr: false, loading: () => <div style={{ minHeight: "50px" }} /> }
);

/**
 * VersionContent - Contenido de una versión (imagen, color, specs)
 * 
 * ✅ OPTIMIZADO: Memoizado para evitar re-renders innecesarios
 * 
 * @param {Object} props
 * @param {Object} props.version - Objeto versión activa
 * @param {Array} props.versiones - Todas las versiones (para tabs)
 * @param {Function} props.onVersionChange - Callback al cambiar versión
 * @param {string} props.modeloMarca - Marca del modelo (ej: 'Peugeot')
 * @param {string} props.modeloNombre - Nombre del modelo (ej: '2008')
 * @param {Object} props.colorActivo - Objeto color activo
 * @param {Array} props.coloresDisponibles - Array de colores disponibles
 * @param {Object} props.imagenActual - { url, alt, hasImage }
 * @param {Function} props.onColorChange - Callback al cambiar color
 * @param {string} [props.modelSlug] - Slug del modelo (ej. '208', '2008') para ajustes de posición de imagen
 */
export const VersionContent = memo(function VersionContent({
  version,
  versiones,
  onVersionChange,
  modeloMarca = "",
  modeloNombre = "",
  colorActivo,
  coloresDisponibles,
  imagenActual,
  onColorChange,
  modelSlug,
  contactCta = null,
}) {
  if (!version) return null;

  const hasMultipleVersions = versiones && versiones.length > 1;

  // Imagen principal: siempre la del color seleccionado (carrusel de colores)
  const imageUrl = imagenActual?.url || null;
  const imageAlt =
    imagenActual?.alt || `${modeloNombre} ${version.nombre}`;

  // Renderizar AMBOS layouts siempre para evitar errores de hidratación
  // CSS se encarga de mostrar/ocultar según breakpoint
  return (
    <>
      {/* Layout Mobile: imagen del auto por color */}
      <article className={styles.mobileContainer}>
        <div className={styles.imageContainer} data-model-slug={modelSlug || undefined}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={800}
              height={600}
              className={styles.image}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              quality={85}
              loading="lazy"
            />
          ) : (
            <div
              className={styles.imagePlaceholder}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-neutral-400)",
                fontSize: "0.875rem",
              }}
            >
              Imagen no disponible
            </div>
          )}
        </div>

        {/* Selector de colores + CTA de contacto en la misma fila (botón al final) */}
        <div className={styles.colorCtaRow}>
          {coloresDisponibles && coloresDisponibles.length > 0 && (
            <div className={styles.colorSection}>
              <h3 className={styles.colorTitle}>Colores</h3>
              <ColorSelector
                colores={coloresDisponibles}
                colorActivo={colorActivo?.key}
                onColorChange={onColorChange}
                size="md"
              />
              {colorActivo && (
                <span className={styles.colorLabel}>{colorActivo.label}</span>
              )}
            </div>
          )}
          {contactCta}
        </div>

        {/* Tabs de versiones: arriba de los datos, no del contenedor de la imagen */}
        {hasMultipleVersions && (
          <div className={styles.tabsAboveData}>
            <VersionTabs
              versiones={versiones}
              versionActivaId={version?.id}
              onVersionChange={onVersionChange}
            />
          </div>
        )}

        {/* Info: solo título y párrafo */}
        <div className={styles.infoSection}>
          <h3 className={styles.modeloVersionLabel}>Modelo versión</h3>
          <div className={styles.versionTitleRow}>
            <h2 className={styles.versionTitle}>
              {modeloNombre && <>{modeloNombre} <span className={styles.titleSeparator}>|</span> </>}
              {version.nombre}
            </h2>
          </div>
          <p className={styles.versionDescription}>{version.descripcion}</p>
        </div>

        {/* Foto por versión (mobile): debajo de los datos, tamaño natural sin deformar */}
        {version.itemsImage?.mobile?.url && (
          <div className={styles.itemsImageMobile}>
            <Image
              src={version.itemsImage.mobile.url}
              alt={`Peugeot ${modeloNombre} ${version.nombre}`}
              width={800}
              height={600}
              className={styles.itemsImage}
              /* Solo se ve en mobile. En desktop el layout queda oculto pero
                 la imagen igual se descargaba (~70KB): con "1px" baja una
                 versión de 16px (~300 bytes). Patrón del Hero. */
              sizes="(max-width: 767px) 100vw, 1px"
              quality={85}
              loading="lazy"
            />
          </div>
        )}
      </article>

      {/* Layout Desktop: imagen del auto por color; derecha = contenido + colores */}
      <article className={styles.desktopWrapper}>
        <div className={styles.desktopContainer}>
          {/* Columna izquierda: solo imagen */}
          <div className={styles.leftColumn}>
            <div className={styles.imageContainer} data-model-slug={modelSlug || undefined}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  width={800}
                  height={600}
                  className={styles.image}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  quality={85}
                  loading="lazy"
                />
              ) : (
                <div
                  className={styles.imagePlaceholder}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-neutral-400)",
                    fontSize: "0.875rem",
                  }}
                >
                  Imagen no disponible
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Tabs + Info + selector de colores abajo (centrado) */}
          <div className={styles.rightColumn}>
            {hasMultipleVersions && (
              <div className={styles.tabsAboveData}>
                <VersionTabs
                  versiones={versiones}
                  versionActivaId={version?.id}
                  onVersionChange={onVersionChange}
                />
              </div>
            )}
            <h3 className={styles.modeloVersionLabel}>Modelo versión</h3>
            <div className={styles.versionTitleRow}>
              <h2 className={styles.versionTitle}>
                {modeloNombre && <>{modeloNombre} <span className={styles.titleSeparator}>|</span> </>}
                {version.nombre}
              </h2>
            </div>
            <p className={styles.versionDescription}>{version.descripcion}</p>

            {/* Selector de colores + CTA de contacto en la misma fila (botón al final) */}
            <div className={styles.colorCtaRow}>
              {coloresDisponibles && coloresDisponibles.length > 0 && (
                <div className={styles.colorSectionRight}>
                  <h3 className={styles.colorTitle}>Colores</h3>
                  <div className={styles.colorSelectorWrap}>
                    <ColorSelector
                      colores={coloresDisponibles}
                      colorActivo={colorActivo?.key}
                      onColorChange={onColorChange}
                      size="md"
                    />
                  </div>
                  {colorActivo && (
                    <span className={styles.colorLabel}>{colorActivo.label}</span>
                  )}
                </div>
              )}
              {contactCta}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}, (prevProps, nextProps) => {
  // ✅ Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.version?.id === nextProps.version?.id &&
    prevProps.colorActivo?.key === nextProps.colorActivo?.key &&
    prevProps.imagenActual?.url === nextProps.imagenActual?.url &&
    prevProps.modeloNombre === nextProps.modeloNombre &&
    prevProps.modeloMarca === nextProps.modeloMarca &&
    prevProps.versiones?.length === nextProps.versiones?.length
  );
});

VersionContent.displayName = "VersionContent";

