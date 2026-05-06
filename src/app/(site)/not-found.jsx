import SiteNotFoundBody from "../../components/errors/SiteNotFoundBody";

export const metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: true },
};

/**
 * 404 dentro del segmento público: NO repetir `PublicSiteLayout` (ya lo define `(site)/layout`).
 * Si se anida de nuevo, se duplican Nav, footer y botón flotante de WhatsApp.
 */
export default function SiteNotFound() {
  return <SiteNotFoundBody />;
}
