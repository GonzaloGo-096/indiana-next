"use client";

import { useModeloSelector } from "../../../components/ceroKm/useModeloSelector";
import dynamic from "next/dynamic";
import { VersionContent } from "../../../components/ceroKm/VersionContent";
import { useIsDesktop } from "../../../hooks";
import styles from "./0km-detalle.module.css";

// ✅ Code splitting: VersionTabs solo se carga si hay múltiples versiones
const VersionTabs = dynamic(
  () => import("../../../components/ceroKm/VersionTabs").then((mod) => mod.VersionTabs),
  {
    loading: () => <div style={{ minHeight: "60px" }} />, // Placeholder mínimo
  }
);

/**
 * Client Component wrapper para manejar estado de versión/color
 * 
 * SOLUCIÓN AL BUG: Renderiza UN SOLO VersionContent con layout dinámico
 * según breakpoint, eliminando el doble render que causaba conflictos
 * en el selector de colores y las imágenes.
 */
export function ModeloDetalleClient({ autoSlug, modelo }) {
  const {
    versiones,
    versionActiva,
    colorActivo,
    coloresDisponibles,
    imagenActual,
    cambiarVersion,
    cambiarColor,
  } = useModeloSelector(autoSlug);

  const hasMultipleVersions = versiones && versiones.length > 1;

  return (
    <>
      {/* Tabs de versiones (visible solo si hay más de una versión) */}
      {hasMultipleVersions && (
        <div className={styles.tabsContainer}>
          <VersionTabs
            versiones={versiones}
            versionActivaId={versionActiva?.id}
            onVersionChange={cambiarVersion}
          />
        </div>
      )}

      {/* VersionContent renderiza ambos layouts, CSS maneja mostrar/ocultar */}
      {/* Esto evita errores de hidratación (servidor vs cliente) */}
      <VersionContent
        version={versionActiva}
        modeloMarca={modelo.marca}
        modeloNombre={modelo.nombre}
        colorActivo={colorActivo}
        coloresDisponibles={coloresDisponibles}
        imagenActual={imagenActual}
        onColorChange={cambiarColor}
      />
    </>
  );
}

