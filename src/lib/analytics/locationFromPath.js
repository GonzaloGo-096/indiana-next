/**
 * Mapea el pathname actual al enum LOCATIONS para tracking.
 * Se usa donde no hay un location estático (ej: WhatsApp flotante).
 */

import { LOCATIONS } from "./events";

export function locationFromPathname(pathname) {
  if (!pathname || typeof pathname !== "string") return LOCATIONS.HOME;
  if (pathname === "/") return LOCATIONS.HOME;
  if (pathname.startsWith("/0km/")) return LOCATIONS.OKM_DETAIL;
  if (pathname === "/0km" || pathname.startsWith("/0km?"))
    return LOCATIONS.OKM_LIST;
  if (pathname.startsWith("/usados/") && pathname !== "/usados/vehiculos")
    return LOCATIONS.USADOS_DETAIL;
  if (pathname.startsWith("/usados")) return LOCATIONS.USADOS_LIST;
  if (pathname.startsWith("/planes/")) return LOCATIONS.PLAN_DETAIL;
  if (pathname.startsWith("/planes")) return LOCATIONS.PLANES_LIST;
  if (pathname.startsWith("/postventa")) return LOCATIONS.POSTVENTA;
  if (pathname.startsWith("/trabaja-con-nosotros")) return LOCATIONS.CAREERS;
  if (pathname.startsWith("/maintenance")) return LOCATIONS.MAINTENANCE;
  return LOCATIONS.HOME;
}
