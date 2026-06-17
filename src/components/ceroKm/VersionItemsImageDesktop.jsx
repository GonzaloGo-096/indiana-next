"use client";

import Image from "next/image";
import { useModeloSelectorContext } from "./ModeloSelectorContext";
import styles from "./VersionItemsImageDesktop.module.css";

/**
 * VersionItemsImageDesktop - Imagen items 0km por versión (solo desktop)
 * Se muestra debajo de la sección carrusel/colores/datos. Usa el contexto compartido
 * para mostrar la imagen de la versión actualmente seleccionada (Active, Allure, GT, etc.).
 *
 * @param {Object} props
 * @param {string} props.modeloNombre - Nombre del modelo para alt (ej: '2008')
 */
export function VersionItemsImageDesktop({ modeloNombre }) {
  const { versionActiva } = useModeloSelectorContext();
  const itemsImage = versionActiva?.itemsImage?.desktop;

  if (!itemsImage?.url) return null;

  return (
    <section className={styles.itemsImageDesktop}>
      <Image
        src={itemsImage.url}
        alt={`Peugeot ${modeloNombre} ${versionActiva?.nombre || ""} - Items de equipamiento`}
        width={1200}
        height={600}
        className={styles.itemsImage}
        sizes="(min-width: 768px) 100vw, 1px"
        quality={85}
        loading="lazy"
      />
    </section>
  );
}
