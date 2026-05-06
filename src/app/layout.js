import { Poppins, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "../lib/site-url";
import ConsentBootstrap from "../components/analytics/ConsentBootstrap";

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
    template: "%s | Peugeot Indiana",
    default: "Peugeot Indiana – Concesionaria Oficial en Tucumán | 0km y Usados",
  },
  description:
    "Conocé la oferta de Peugeot Indiana en Tucumán: autos 0km, usados seleccionados, planes de ahorro y atención comercial.",
  openGraph: {
    title: "Peugeot Indiana – Concesionaria Oficial en Tucumán",
    description:
      "Concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y vehículos usados multimarca.",
    url: "/",
    siteName: "Indiana Peugeot",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Peugeot Indiana – Concesionaria Oficial en Tucumán",
    description:
      "Concesionaria oficial Peugeot en Tucumán. Autos 0km Peugeot y vehículos usados multimarca.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        {/* Consent Mode v2 default — inyectado ANTES de cualquier loader (GTM, Meta).
            Lee localStorage para reaplicar la decisión persistida. */}
        <ConsentBootstrap />
      </head>
      <body
        className={`${poppins.variable} ${barlowCondensed.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
