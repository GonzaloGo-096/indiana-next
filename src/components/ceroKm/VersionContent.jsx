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
}) {
  if (!version) return null;

  const hasMultipleVersions = versiones && versiones.length > 1;

  const imageUrl = imagenActual?.url || null;
  const imageAlt =
    imagenActual?.alt || `${modeloNombre} ${version.nombre}`;

  // Renderizar AMBOS layouts siempre para evitar errores de hidratación
  // CSS se encarga de mostrar/ocultar según breakpoint
  return (
    <>
      {/* Layout Mobile */}
      <article className={styles.mobileContainer}>
        {/* Imagen */}
        <div className={styles.imageContainer}>
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

        {/* Selector de colores */}
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

        {/* Info */}
        <div className={styles.infoSection}>
          <h3 className={styles.modeloVersionLabel}>Modelo versión</h3>
          <h2 className={styles.versionTitle}>
            {modeloNombre && <>{modeloNombre} <span className={styles.titleSeparator}>|</span> </>}
            {version.nombre}
          </h2>
          <p className={styles.versionDescription}>{version.descripcion}</p>
        </div>

        {/* Equipamiento */}
        {version.equipamiento && (
          <div className={styles.equipamientoSection}>
            {version.equipamiento.titulo && (
              <h3 className={styles.equipamientoTitle}>
                {version.equipamiento.titulo}
              </h3>
            )}
            <ul className={styles.equipamientoList}>
              {version.equipamiento.items.map((item, index) => (
                <li 
                  key={`${version.id}-equip-${index}-${item.slice(0, 20).replace(/\s/g, '-')}`} 
                  className={styles.equipamientoItem}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

      {/* Layout Desktop */}
      <article className={styles.desktopWrapper}>
      <div className={styles.desktopContainer}>
        {/* Columna izquierda: Imagen + Color */}
        <div className={styles.leftColumn}>
          <div className={styles.imageContainer}>
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

          {/* Selector de colores */}
          {coloresDisponibles && coloresDisponibles.length > 0 && (
            <div className={styles.colorSection}>
              <h3 className={styles.colorTitle}>Colores</h3>
              <ColorSelector
                colores={coloresDisponibles}
                colorActivo={colorActivo?.key}
                onColorChange={onColorChange}
                size="lg"
              />
              {colorActivo && (
                <span className={styles.colorLabel}>{colorActivo.label}</span>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha: Tabs + Info + Equipamiento (tabs arriba de los datos) */}
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
          <h2 className={styles.versionTitle}>
            {modeloNombre && <>{modeloNombre} <span className={styles.titleSeparator}>|</span> </>}
            {version.nombre}
          </h2>
          <p className={styles.versionDescription}>{version.descripcion}</p>

          {version.equipamiento && (
            <div className={styles.equipamientoSection}>
              {version.equipamiento.titulo && (
                <h3 className={styles.equipamientoTitle}>
                  {version.equipamiento.titulo}
                </h3>
              )}
              <ul className={styles.equipamientoList}>
                {version.equipamiento.items.map((item, index) => (
                  <li 
                    key={`${version.id}-equip-${index}-${item.slice(0, 20).replace(/\s/g, '-')}`} 
                    className={styles.equipamientoItem}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
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

