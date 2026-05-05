"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Nav from "./Nav";
import FooterLazy from "./Footer/FooterLazy";
import ClientOnlyComponents from "./ClientOnlyComponents";
import MarketingTracking from "../tracking/MarketingTracking";
import PageViewTracker from "../analytics/PageViewTracker";

// Banner client-only para evitar hydration mismatch:
// en SSR no sabemos si el usuario ya decidió (localStorage es client-only),
// así que no renderizamos el banner en server.
const ConsentBanner = dynamic(() => import("../analytics/ConsentBanner"), {
  ssr: false,
});

/**
 * Chrome público (Nav + main + Footer + tracking) como Client Component.
 * Permite reutilizar el mismo shell desde boundaries que deben ser Client Components
 * (`app/error.jsx`) sin duplicar markup ni romper reglas RSC.
 *
 * `PublicSiteLayout` (Server) envuelve a los hijos con Suspense y delega aquí.
 *
 * Orden de tracking (importante):
 *   <head> root layout: ConsentBootstrap (default 'denied' antes de GTM)
 *   → MarketingTracking (loaders GTM/Meta)
 *   → PageViewTracker (page_view en cada navegación SPA, dentro de Suspense)
 *   → ConsentBanner (UI opt-in)
 */
export default function PublicSiteChrome({ children }) {
  return (
    <>
      <MarketingTracking />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <ClientOnlyComponents />
      <Nav />
      <main className="main-content">{children}</main>
      <FooterLazy />
      <ConsentBanner />
    </>
  );
}
