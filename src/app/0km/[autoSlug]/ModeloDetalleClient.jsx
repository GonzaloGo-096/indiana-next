"use client";

import { useModeloSelector } from "../../../components/ceroKm/useModeloSelector";
import { VersionContent } from "../../../components/ceroKm/VersionContent";

/**
 * Client Component wrapper para manejar estado de versión/color.
 * Los tabs de versión se renderizan dentro de VersionContent, arriba de los datos.
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

  return (
    <VersionContent
      version={versionActiva}
      versiones={versiones}
      onVersionChange={cambiarVersion}
      modeloMarca={modelo.marca}
      modeloNombre={modelo.nombre}
      colorActivo={colorActivo}
      coloresDisponibles={coloresDisponibles}
      imagenActual={imagenActual}
      onColorChange={cambiarColor}
      modelSlug={autoSlug}
    />
  );
}

