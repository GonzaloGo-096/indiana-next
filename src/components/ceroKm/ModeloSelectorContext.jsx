"use client";

import { createContext, useContext } from "react";
import { useModeloSelector } from "./useModeloSelector";

const ModeloSelectorContext = createContext(null);

/**
 * Provee el estado de versión/color del modelo para toda la página del 0km.
 * Así la foto por versión (VersionItemsImageDesktop) y los tabs (VersionContent)
 * comparten la misma versión activa.
 */
export function ModeloSelectorProvider({ modeloSlug, children }) {
  const value = useModeloSelector(modeloSlug);
  return (
    <ModeloSelectorContext.Provider value={value}>
      {children}
    </ModeloSelectorContext.Provider>
  );
}

export function useModeloSelectorContext() {
  const ctx = useContext(ModeloSelectorContext);
  if (!ctx) {
    throw new Error("useModeloSelectorContext debe usarse dentro de ModeloSelectorProvider");
  }
  return ctx;
}
