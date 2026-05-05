import { buildConsentDefaultSnippet } from "@/lib/analytics/consent";

/**
 * Inyecta el snippet de Google Consent Mode v2 default ANTES de que cargue GTM.
 *
 * Se monta dentro de <head> en el root layout (`app/layout.js`).
 * Usamos un <script> inline (no <Script> de Next) para garantizar ejecución
 * sincrónica antes de cualquier otro loader. El snippet es estático y autogenerado;
 * no contiene datos de usuario.
 */
export default function ConsentBootstrap() {
  const snippet = buildConsentDefaultSnippet();
  return (
    <script dangerouslySetInnerHTML={{ __html: snippet }} />
  );
}
