"use client";

import { useEffect } from "react";
import Link from "next/link";
import PublicSiteChrome from "../components/layout/PublicSiteChrome";
import { errorBoundaryStyles } from "../components/errors/errorBoundaryStyles";

/**
 * Error boundary raíz para el sitio público y rutas sin boundary propio.
 * Usa el mismo chrome que `(site)` vía `PublicSiteChrome` (Nav, footer, tracking).
 * El panel admin define `admin/error.jsx` para no mostrar marketing en fallos del panel.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error en página:", error);
    }
  }, [error]);

  return (
    <PublicSiteChrome>
      <style dangerouslySetInnerHTML={{ __html: errorBoundaryStyles }} />
      <div className="eb-container">
        <div className="eb-content">
          <div className="eb-icon">⚠️</div>
          <h1 className="eb-title">Algo salió mal</h1>
          <p className="eb-description">
            Ocurrió un error inesperado al cargar esta página. Por favor, intenta
            nuevamente.
          </p>
          <div className="eb-actions">
            <button type="button" onClick={reset} className="eb-button">
              Reintentar
            </button>
            <Link href="/" className="eb-link">
              Ir al inicio
            </Link>
          </div>
          {process.env.NODE_ENV === "development" && error && (
            <details className="eb-details">
              <summary className="eb-summary">Detalles técnicos (desarrollo)</summary>
              <pre className="eb-stack">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </PublicSiteChrome>
  );
}
