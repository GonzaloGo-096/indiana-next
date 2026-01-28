"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

/**
 * Global Error Boundary
 * 
 * Este componente captura errores que ocurren en el root layout.
 * Solo se renderiza cuando hay un error crítico que afecta toda la aplicación.
 * 
 * IMPORTANTE: Este componente debe definir su propio <html> y <body> tags
 * porque el layout raíz falló.
 * 
 * @param {Object} props
 * @param {Error} props.error - El error que ocurrió
 * @param {Function} props.reset - Función para reintentar
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log del error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error global en aplicación:", error);
    }
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.icon}>🌐❌</div>
            <h1 className={styles.title}>Error Crítico</h1>
            <p className={styles.description}>
              Ha ocurrido un error crítico en la aplicación. Por favor, recarga
              la página o contacta con soporte si el problema persiste.
            </p>
            <div className={styles.actions}>
              <button onClick={reset} className={styles.button}>
                🔄 Reintentar
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.button}
              >
                🔄 Recargar página
              </button>
            </div>
            {process.env.NODE_ENV === "development" && error && (
              <details className={styles.details}>
                <summary className={styles.summary}>
                  Detalles técnicos (desarrollo)
                </summary>
                <pre className={styles.errorStack}>
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



