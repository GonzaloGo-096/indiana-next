import { Suspense } from "react";
import { Poppins, Barlow_Condensed } from "next/font/google";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import "./globals.css";
import { getSiteUrl } from "../lib/site-url";
import Nav from "../components/layout/Nav";
import ClientOnlyComponents from "../components/layout/ClientOnlyComponents";
import MarketingTracking from "../components/tracking/MarketingTracking";

const Footer = dynamic(() => import("../components/layout/Footer"), {
  ssr: true,
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: {
      url: "/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp",
      type: "image/webp",
    },
    shortcut: "/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp",
    apple: "/assets/logos/logos-indiana/desktop/azul-solo-desktop.webp",
  },
  title: {
    template: "%s | Indiana Peugeot",
    default:
      "Indiana Peugeot – Concesionaria Oficial en Tucumán | 0km y Usados",
  },
  description:
    "Indiana Peugeot es concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y amplia selección de vehículos usados multimarca con garantía, financiamiento y servicio postventa.",
  openGraph: {
    title: "Indiana Peugeot – Concesionaria Oficial en Tucumán",
    description:
      "Concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y vehículos usados multimarca.",
    url: "/",
    siteName: "Indiana Peugeot",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indiana Peugeot – Concesionaria Oficial en Tucumán",
    description:
      "Concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y vehículos usados multimarca.",
  },
  alternates: {
    canonical: "/",
  },
};

/** Fallback mínimo durante navegación para evitar error de "async info / Suspense boundary" (React DevTools + Next) */
function PageFallback() {
  return <div style={{ minHeight: "50vh" }} aria-hidden />;
}

export default async function RootLayout({ children }) {
  const requestHeaders = await headers();
  const isMaintenanceView = requestHeaders.get("x-maintenance-view") === "1";
  const skipMarketing =
    isMaintenanceView || requestHeaders.get("x-indiana-no-tracking") === "1";

  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body
        className={`${poppins.variable} ${barlowCondensed.variable}`}
      >
        {!skipMarketing && <MarketingTracking />}
        {!isMaintenanceView && <ClientOnlyComponents />}
        {!isMaintenanceView && <Nav />}
        <main
          className={
            isMaintenanceView
              ? "main-content main-content--maintenance"
              : "main-content"
          }
        >
          <Suspense fallback={<PageFallback />}>
            {children}
          </Suspense>
        </main>
        {!isMaintenanceView && (
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        )}
      </body>
    </html>
  );
}
