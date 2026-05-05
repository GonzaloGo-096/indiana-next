"use client";

import { useEffect, useRef } from "react";
import { useConsent } from "@/hooks/useConsent";

/**
 * Banner de consentimiento de cookies (Consent Mode v2).
 * - Solo se muestra si no hay decisión previa en localStorage.
 * - Aceptar/Rechazar persiste en localStorage y dispara updateConsent al GTM.
 * - Accesible: role="dialog", aria-modal=false (no bloquea), ESC = rechazar.
 *
 * Se monta vía `dynamic({ ssr: false })` desde PublicSiteChrome para evitar
 * hydration mismatch (la decisión vive en localStorage, client-only).
 */
export default function ConsentBanner() {
  const { isUnknown, acceptAll, rejectAll } = useConsent();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isUnknown) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") rejectAll();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      const btn = dialogRef.current?.querySelector("[data-consent-primary]");
      if (btn) btn.focus();
    }, 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [isUnknown, rejectAll]);

  if (!isUnknown) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-live="polite"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[1000] mx-auto w-full max-w-3xl rounded-t-xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-4 sm:rounded-xl sm:p-5"
    >
      <h2
        id="consent-banner-title"
        className="mb-1 text-base font-semibold text-slate-900"
      >
        Tu privacidad
      </h2>
      <p id="consent-banner-desc" className="mb-3 text-sm text-slate-600">
        Usamos cookies y tecnologías similares para mejorar tu experiencia,
        analizar el tráfico y mostrarte contenido relevante. Podés aceptar todas
        o rechazarlas. Esta elección queda guardada en tu navegador.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={rejectAll}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={acceptAll}
          data-consent-primary
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Aceptar todas
        </button>
      </div>
    </div>
  );
}
