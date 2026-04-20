"use client";

import { useModeloSelectorContext } from "../../../../components/ceroKm/ModeloSelectorContext";
import { VersionContent } from "../../../../components/ceroKm/VersionContent";

/**
 * Client Component wrapper para manejar estado de versión/color.
 * Usa el contexto compartido para que la versión activa sea la misma en tabs y en la foto por versión.
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
  } = useModeloSelectorContext();

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

