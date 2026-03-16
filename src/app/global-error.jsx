"use client";

import { useEffect } from "react";

/**
 * Estilos para global error (mismo que error.jsx; sin depender de error.module.css)
 */
const globalErrorStyles = `
  .eb-container { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: #fff; }
  .eb-content { max-width: 600px; width: 100%; text-align: center; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
  .eb-icon { font-size: 4rem; margin-bottom: 1rem; line-height: 1; }
  .eb-title { font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 700; font-family: system-ui, sans-serif; color: #202124; margin: 0 0 1rem 0; text-transform: uppercase; letter-spacing: 0.5px; }
  .eb-description { font-size: 1rem; line-height: 1.6; color: #5f6368; margin: 0 0 1.5rem 0; }
  .eb-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .eb-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: #061B9C; color: #fff; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
  .eb-button:hover { background: #051080; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(6,27,156,0.3); }
  .eb-button:focus-visible { outline: 2px solid #061B9C; outline-offset: 2px; }
  .eb-details { margin-top: 1.5rem; text-align: left; border-top: 1px solid #e8eaed; padding-top: 1rem; }
  .eb-summary { font-size: 0.875rem; font-weight: 600; color: #80868b; cursor: pointer; user-select: none; margin-bottom: 0.5rem; }
  .eb-stack { font-size: 0.75rem; font-family: "Courier New", monospace; color: #5f6368; background: #f8f9fa; padding: 1rem; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; line-height: 1.5; }
`;

/**
 * Global Error Boundary
 *
 * Captura errores en el root layout. Define su propio <html> y <body>.
 * Estilos inyectados para no depender de error.module.css (evita preload warning).
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Error global en aplicación:", error);
    }
  }, [error]);

  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: globalErrorStyles }} />
      </head>
      <body>
        <div className="eb-container">
          <div className="eb-content">
            <div className="eb-icon">🌐❌</div>
            <h1 className="eb-title">Error Crítico</h1>
            <p className="eb-description">
              Ha ocurrido un error crítico en la aplicación. Por favor, recarga
              la página o contacta con soporte si el problema persiste.
            </p>
            <div className="eb-actions">
              <button onClick={reset} className="eb-button">
                🔄 Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="eb-button"
              >
                🔄 Recargar página
              </button>
            </div>
            {process.env.NODE_ENV === "development" && error && (
              <details className="eb-details">
                <summary className="eb-summary">
                  Detalles técnicos (desarrollo)
                </summary>
                <pre className="eb-stack">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
