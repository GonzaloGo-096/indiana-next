import Link from "next/link";

/**
 * Contenido 404 sin chrome (Nav/footer).
 * - `app/(site)/not-found.jsx`: solo esto (el layout `(site)` ya aporta el shell).
 * - `app/not-found.jsx`: envuelto en `PublicSiteLayout` para URLs fuera de `(site)`.
 */
export default function SiteNotFoundBody() {
  return (
    <div
      style={{
        padding: "3rem 1.5rem",
        textAlign: "center",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", marginBottom: "0.75rem" }}>
        404 — Página no encontrada
      </h1>
      <p style={{ marginBottom: "1.5rem", color: "var(--color-neutral-700, #5f6368)" }}>
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          padding: "0.75rem 1.5rem",
          background: "var(--color-brand-500, #061B9C)",
          color: "#fff",
          borderRadius: "8px",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
