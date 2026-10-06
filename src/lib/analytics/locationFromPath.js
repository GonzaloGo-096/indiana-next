import { LOCATIONS } from "./events";

/** Sección del sitio a partir de la URL; es el `location` de todos los eventos. */
export function locationFromPathname(pathname) {
  if (!pathname || pathname === "/") return LOCATIONS.HOME;
  if (pathname.startsWith("/0km/")) return LOCATIONS.OKM_DETAIL;
  if (pathname.startsWith("/0km")) return LOCATIONS.OKM_LIST;
  if (pathname.startsWith("/usados/") && pathname !== "/usados/vehiculos")
    return LOCATIONS.USADOS_DETAIL;
  if (pathname.startsWith("/usados")) return LOCATIONS.USADOS_LIST;
  if (pathname.startsWith("/planes/")) return LOCATIONS.PLAN_DETAIL;
  if (pathname.startsWith("/planes")) return LOCATIONS.PLANES_LIST;
  if (pathname.startsWith("/postventa")) return LOCATIONS.POSTVENTA;
  if (pathname.startsWith("/trabaja-con-nosotros")) return LOCATIONS.CAREERS;
  return LOCATIONS.HOME;
}
