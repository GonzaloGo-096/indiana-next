"use client";

import Nav from "./Nav";
import FooterLazy from "./Footer/FooterLazy";
import ClientOnlyComponents from "./ClientOnlyComponents";
import MarketingTracking from "../tracking/MarketingTracking";

/**
 * Chrome público (Nav + main + Footer + tracking) como Client Component.
 * Permite reutilizar el mismo shell desde boundaries que deben ser Client Components
 * (`app/error.jsx`) sin duplicar markup ni romper reglas RSC.
 *
 * `PublicSiteLayout` (Server) envuelve a los hijos con Suspense y delega aquí.
 */
export default function PublicSiteChrome({ children }) {
  return (
    <>
      <MarketingTracking />
      <ClientOnlyComponents />
      <Nav />
      <main className="main-content">{children}</main>
      <FooterLazy />
    </>
  );
}
