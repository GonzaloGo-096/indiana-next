"use client";

/**
 * Error boundary para /usados/vehiculos
 *
 * Next.js lo activa automáticamente cuando VehiculosClient lanza un error
 * no capturado. Recibe `error` (el objeto de error) y `reset` (función
 * para reintentar el render del segmento sin recargar la página completa).
 *
 * Debe ser Client Component ("use client") por requerimiento de Next.js.
 */
export default function VehiculosError({ error, reset }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 92px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "1.5rem",
        textAlign: "center",
      }}
      role="alert"
      aria-live="assertive"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={{ color: "var(--color-neutral-400, #9aa0a6)", flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 8v4M12 16h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>

      <div style={{ maxWidth: "26rem" }}>
        <p
          style={{
            margin: "0 0 0.5rem",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "var(--color-neutral-800, #202124)",
          }}
        >
          No pudimos cargar los vehículos
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            color: "var(--color-neutral-600, #80868b)",
            lineHeight: 1.5,
          }}
        >
          Puede ser un problema temporal de conexión. Intentá de nuevo o volvé
          al inicio de usados.
        </p>

        {isDev && error?.message && (
          <pre
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 0.75rem",
              background: "var(--color-neutral-100, #f1f3f4)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "var(--color-neutral-700, #5f6368)",
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.message}
          </pre>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.55rem 1.25rem",
            borderRadius: "6px",
            border: "1.5px solid var(--color-brand-500, #061B9C)",
            background: "var(--color-brand-500, #061B9C)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          Reintentar
        </button>

        <a
          href="/usados"
          style={{
            padding: "0.55rem 1.25rem",
            borderRadius: "6px",
            border: "1.5px solid var(--color-neutral-300, #dadce0)",
            background: "transparent",
            color: "var(--color-neutral-700, #5f6368)",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Volver a usados
        </a>
      </div>
    </div>
  );
}
