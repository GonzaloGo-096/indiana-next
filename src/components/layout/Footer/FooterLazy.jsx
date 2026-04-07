"use client";

/**
 * FooterLazy - Carga el Footer solo en el cliente, después del contenido principal.
 * Evita que el footer aparezca antes que el contenido durante transiciones de página.
 *
 * Patrón idéntico al usado en ClientOnlyComponents para ScrollToTopOnMount.
 */

import dynamic from "next/dynamic";

const Footer = dynamic(() => import("./Footer"), { ssr: false });

export default function FooterLazy() {
  return <Footer />;
}
