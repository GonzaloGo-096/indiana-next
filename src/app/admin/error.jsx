"use client";

import { useEffect } from "react";
import Link from "next/link";
import { errorBoundaryStyles } from "@/components/errors/errorBoundaryStyles";

/**
 * Error boundary del panel admin: sin Nav/footer de marketing.
 * Sigue dentro de `admin/layout` (QueryClient, contenedor).
 */
export default function AdminError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error en panel admin:", error);
    }
  }, [error]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: errorBoundaryStyles }} />
      <div className="eb-container">
        <div className="eb-content">
          <div className="eb-icon">⚠️</div>
          <h1 className="eb-title">Error en el panel</h1>
          <p className="eb-description">
            No se pudo cargar esta sección. Podés reintentar o volver al inicio del panel.
          </p>
          <div className="eb-actions">
            <button type="button" onClick={reset} className="eb-button">
              Reintentar
            </button>
            <Link href="/admin" className="eb-link">
              Ir al panel
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
    </>
  );
}
