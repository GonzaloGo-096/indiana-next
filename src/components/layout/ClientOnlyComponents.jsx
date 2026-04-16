"use client";

/**
 * ClientOnlyComponents - Wrapper para componentes que solo funcionan en cliente
 * 
 * ✅ OPTIMIZADO: Dynamic imports con ssr: false en Client Component
 * Permite lazy loading de componentes no críticos sin afectar Server Components
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import dynamic from "next/dynamic";

// ✅ AnalyticsWrapper - No crítico, puede cargar después
const AnalyticsWrapper = dynamic(
  () => import("./AnalyticsWrapper"),
  {
    ssr: false, // Analytics no necesita SSR
  }
);

// ✅ ScrollToTopOnMount - Solo funciona en cliente
const ScrollToTopOnMount = dynamic(
  () => import("./ScrollToTopOnMount").then((mod) => mod.ScrollToTopOnMount),
  {
    ssr: false, // Solo funciona en cliente (usa window)
  }
);

// ✅ WhatsApp flotante - diferido para no cargar en el chunk inicial crítico
const FloatingWhatsAppButton = dynamic(
  () => import("./FloatingWhatsApp/FloatingWhatsAppButton"),
  {
    ssr: false,
  }
);

/**
 * Wrapper que renderiza componentes solo en cliente
 */
export default function ClientOnlyComponents() {
  return (
    <>
      <ScrollToTopOnMount />
      <AnalyticsWrapper />
      <FloatingWhatsAppButton />
    </>
  );
}

