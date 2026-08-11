/**
 * Trae los usados del inicio EN EL SERVER.
 *
 * Reemplaza a HomeUsadosSectionClient, que los pedía desde el navegador con
 * useEffect + axios. Era el único punto del sitio que hablaba con el backend
 * desde el cliente, y era justamente el que estaba roto: la sección del inicio
 * quedó sin autos y nadie se enteró, porque el error solo se logueaba en
 * desarrollo.
 *
 * Traerlos acá elimina la clase entera de fallas:
 *   - no depende de CORS ni de que el navegador ejecute JS
 *   - los autos entran en el HTML, así que los ve Google
 *   - aprovecha el Data Cache con el tag 'vehicles-list', el mismo que usa
 *     /usados: es la misma consulta, no una segunda
 *   - saca axios del bundle del inicio
 *
 * Es un Server Component async y se monta dentro de <Suspense>, así que si el
 * backend tarda, el resto del inicio ya se pintó.
 */

import { vehiclesService } from "@/lib/services/vehiclesApi.server";
import { mapVehiclesPage } from "@/lib/mappers/vehicleMapper";
import { createLogger } from "@/lib/logger";
import { HomeUsadosCarousel } from "./HomeUsadosCarousel";

const log = createLogger("home:usados");

/** Cuántos autos muestra el carrusel del inicio. */
const HOME_USADOS_LIMIT = 6;

export async function HomeUsadosCarouselServer() {
  let vehicles = [];

  try {
    const backendData = await vehiclesService.getVehicles({
      filters: {},
      limit: HOME_USADOS_LIMIT,
      cursor: 1,
    });
    vehicles = mapVehiclesPage(backendData, 1).vehicles || [];
  } catch (error) {
    // No se relanza: que el inicio entero falle por el carrusel sería peor que
    // mostrarlo sin autos. Pero ahora queda registrado y llega a telemetría,
    // que es exactamente lo que faltaba cuando esto se rompió.
    log.error(
      "No se pudieron traer los usados del inicio, la sección queda sin carrusel:",
      error?.message || error,
    );
    return null;
  }

  if (vehicles.length === 0) {
    log.warn("El backend devolvió 0 usados para el inicio.");
    return null;
  }

  return <HomeUsadosCarousel vehicles={vehicles} />;
}

export default HomeUsadosCarouselServer;
