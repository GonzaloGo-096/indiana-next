"use client";

import Image from "next/image";
import { ColorSelector } from "./ColorSelector";
import styles from "./VersionContent.module.css";

/**
 * VersionContent - Contenido de una versión (imagen, color, specs)
 * 
 * @param {Object} props
 * @param {Object} props.version - Objeto versión activa
 * @param {string} props.modeloMarca - Marca del modelo (ej: 'Peugeot')
 * @param {string} props.modeloNombre - Nombre del modelo (ej: '2008')
 * @param {Object} props.colorActivo - Objeto color activo
 * @param {Array} props.coloresDisponibles - Array de colores disponibles
 * @param {Object} props.imagenActual - { url, alt, hasImage }
 * @param {Function} props.onColorChange - Callback al cambiar color
 */
export function VersionContent({
  version,
  modeloMarca = "",
  modeloNombre = "",
  colorActivo,
  coloresDisponibles,
  imagenActual,
  onColorChange,
}) {
  if (!version) return null;

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
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={80}
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

        {/* Info */}
        <div className={styles.infoSection}>
          <h2 className={styles.versionTitle}>{version.nombre}</h2>
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
                <li key={index} className={styles.equipamientoItem}>
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
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={80}
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

        {/* Columna derecha: Info + Equipamiento */}
        <div className={styles.rightColumn}>
          <h2 className={styles.versionTitle}>{version.nombre}</h2>
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
                  <li key={index} className={styles.equipamientoItem}>
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
}

