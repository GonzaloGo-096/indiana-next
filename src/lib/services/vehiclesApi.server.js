/**
 * Servicio de vehículos para Server Components.
 * En el navegador se usa vehiclesApi.js, que pasa por el proxy /api/catalogo.
 *
 * Los datos de vehículos NO se cachean en el frontend: el caché es del backend.
 *
 * Antes cada respuesta quedaba 6 horas en el Data Cache de Next (revalidate
 * 21600 + tags) y las páginas se guardaban como HTML. Un auto borrado seguía
 * en el listado y su ficha terminaba en 404. Invalidar por tag no alcanzaba:
 * justo después de borrar, el CDN del backend todavía entrega la lista vieja
 * (verificado el 2026-09-23: la cachea ~5 min) y Next la volvía a guardar.
 *
 * Por eso todo pedido pasa por fetchFromBackend con 'no-store' explícito. Sin
 * opción de caché, Next prerenderiza en el build las páginas sin APIs
 * dinámicas (/ y /usados) y los autos quedan congelados hasta el próximo
 * deploy. Con 'no-store', al intentar prerenderizar Next lanza un error
 * interno para marcar la ruta como dinámica: quien atrape errores de este
 * servicio tiene que dejarlo pasar con unstable_rethrow.
 */

import { cache } from "react";
import { getApiBaseUrl } from "@/lib/config/api";
import { fetchWithTimeout } from "@/lib/http/server";
import { buildSearchParams } from "@/utils/filters";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:server");

async function fetchFromBackend(path) {
  const endpoint = `${getApiBaseUrl()}${path}`;
  log.debug("GET", endpoint);
  const response = await fetchWithTimeout(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return { endpoint, response };
}

function assertOk(response, endpoint) {
  if (response.ok) return;
  log.error("El backend respondió con error:", {
    status: response.status,
    statusText: response.statusText,
    endpoint,
  });
  throw new Error(`API error: ${response.status} ${response.statusText}`);
}

async function readJson(response, endpoint) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (parseErr) {
    log.error("El backend devolvió algo que no es JSON:", {
      endpoint,
      message: parseErr.message,
    });
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
}

export const vehiclesService = {
  /**
   * Listado de vehículos.
   *
   * @param {Object} options
   * @param {Object} [options.filters] - Filtros del frontend
   * @param {number} [options.limit=12]
   * @param {number} [options.cursor=1] - Página (el backend la llama cursor)
   * @param {boolean} [options.mergeDefaults=false] - Si true, rellena rangos faltantes (precio/km) con FILTER_DEFAULTS. Por defecto false: el listado público muestra todo el inventario y deja que el usuario filtre explícitamente.
   * @returns {Promise<Object|null>} Respuesta del backend
   */
  async getVehicles({ filters = {}, limit = 12, cursor = null, mergeDefaults = false } = {}) {
    const safeLimit = Number(limit) > 0 ? Number(limit) : 12;
    const safeCursor = Number(cursor) > 0 ? Number(cursor) : 1;

    // Los rangos que están en su posición inicial NO se mandan.
    //
    // Antes iba `includeDefaultRanges: true`, que los mandaba siempre. El
    // formulario guarda los tres rangos aunque el visitante no los toque,
    // así que al filtrar por año también viajaba "precio desde 5.000.000":
    // un filtro que nadie pidió. Y como ese mínimo no coincide con el
    // inventario real, borraba autos válidos y podía dejar la lista vacía.
    //
    // "Rango completo" y "sin filtrar" son lo mismo, así que omitirlo no
    // cambia el resultado: solo deja de esconder autos.
    const searchParams = buildSearchParams(filters, { mergeDefaults });
    searchParams.set("limit", String(safeLimit));
    searchParams.set("cursor", String(safeCursor));

    const { endpoint, response } = await fetchFromBackend(
      `/photos/getallphotos?${searchParams}`,
    );
    assertOk(response, endpoint);
    return readJson(response, endpoint);
  },

  /**
   * Un vehículo por ID, o null si no existe.
   *
   * Envuelto en cache() de React: la ficha lo pide desde generateMetadata y
   * desde la página. fetchWithTimeout pasa un `signal`, y con signal Next no
   * deduplica el fetch; sin esto cada visita le pegaba dos veces al backend.
   * cache() vale solo dentro de un mismo request: no guarda nada entre visitas.
   *
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  getVehicleById: cache(async (id) => {
    const cleanId = String(id ?? "").trim();
    if (!cleanId) throw new Error("ID de vehículo inválido");

    const { endpoint, response } = await fetchFromBackend(
      `/photos/getonephoto/${cleanId}`,
    );

    // Auto borrado o inexistente: null, no error. El backend deployado
    // responde 404 "Auto no encontrado" (verificado el 2026-09-23); el del
    // repo respondía 200 con getOnePhoto null. Los dos terminan en null, y
    // con null la ficha llama a notFound().
    if (response.status === 404) return null;

    assertOk(response, endpoint);
    const data = await readJson(response, endpoint);
    // El backend responde { getOnePhoto: {...} }; se acepta también el objeto pelado.
    return data && "getOnePhoto" in data ? data.getOnePhoto : data;
  }),
};
