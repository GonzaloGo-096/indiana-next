import PublicSiteLayout from "../components/layout/PublicSiteLayout";
import SiteNotFoundBody from "../components/errors/SiteNotFoundBody";

/**
 * 404 global para URLs que no entran en `(site)` (solo `app/layout` como padre).
 * Ahí sí hace falta el shell público.
 */
export default function NotFound() {
  return (
    <PublicSiteLayout>
      <SiteNotFoundBody />
    </PublicSiteLayout>
  );
}
