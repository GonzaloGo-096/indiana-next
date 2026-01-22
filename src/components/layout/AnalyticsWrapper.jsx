"use client";

/**
 * AnalyticsWrapper - Client Component wrapper para Analytics
 * 
 * Permite lazy loading de Analytics sin afectar el Server Component layout
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import dynamic from "next/dynamic";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => mod.Analytics),
  { ssr: false } // Analytics no necesita SSR
);

export default function AnalyticsWrapper() {
  return <Analytics />;
}


