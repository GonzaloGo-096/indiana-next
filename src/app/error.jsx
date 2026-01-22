"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

/**
 * Error Boundary para rutas específicas
 * 
 * Next.js automáticamente envuelve cada ruta con este componente
 * cuando ocurre un error durante el renderizado.
 * 
 * @param {Object} props
 * @param {Error} props.error - El error que ocurrió
 * @param {Function} props.reset - Función para reintentar
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Log del error para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.error("Error en página:", error);
    }
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>⚠️</div>
        <h1 className={styles.title}>Algo salió mal</h1>
        <p className={styles.description}>
          Ocurrió un error inesperado al cargar esta página. Por favor, intenta
          nuevamente.
        </p>
        <div className={styles.actions}>
          <button onClick={reset} className={styles.button}>
            🔄 Reintentar
          </button>
          <Link href="/" className={styles.link}>
            🏠 Ir al inicio
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && error && (
          <details className={styles.details}>
            <summary className={styles.summary}>Detalles técnicos (desarrollo)</summary>
            <pre className={styles.errorStack}>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}


