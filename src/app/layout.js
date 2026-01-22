import { Poppins, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "../lib/site-url";
import Nav from "../components/layout/Nav";
import Footer from "../components/layout/Footer";
import AnalyticsWrapper from "../components/layout/AnalyticsWrapper";
import { ScrollToTopOnMount } from "../components/layout/ScrollToTopOnMount";

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

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} ${barlowCondensed.variable}`}
      >
        {/* ✅ Scroll al top al cargar página - ANTES de cualquier contenido */}
        <ScrollToTopOnMount />
        <Nav />
        <main className="main-content">
          {children}
        </main>
        <Footer />
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
