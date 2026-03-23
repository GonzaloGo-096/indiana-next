/**
 * vehiclesApi.server.js - Servicio de vehículos para Server Components
 * 
 * Usa fetch nativo de Next.js para aprovechar:
 * - Deduplicación automática de requests
 * - Caching automático
 * - Mejor performance en Server Components
 * 
 * ⚠️ IMPORTANTE: Este archivo solo debe usarse en Server Components
 * Para Client Components, usar vehiclesApi.js (con axios)
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import { getApiBaseUrl } from "@/lib/config/api";
import { fetchWithTimeout } from "@/lib/http/server";
import { buildSearchParams } from "@/utils/filters";

/**
 * Servicio de vehículos para Server Components
 */
export const vehiclesService = {
  /**
   * Obtener lista de vehículos (Server Component)
   * 
   * Usa fetch nativo para aprovechar deduplicación y caching de Next.js
   * 
   * @param {Object} options - Opciones de búsqueda
   * @param {Object} options.filters - Filtros del frontend
   * @param {number} options.limit - Cantidad de resultados (default: 12)
   * @param {number} options.cursor - Cursor de paginación (default: 1)
   * @returns {Promise<Object>} Respuesta del backend
   */
  async getVehicles({ filters = {}, limit = 12, cursor = null } = {}) {
    try {
      // Validaciones y normalizaciones
      const safeLimit =
        Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 12;
      const safeCursor =
        Number.isFinite(Number(cursor)) && Number(cursor) > 0 ? Number(cursor) : 1;

      // Construir URL: buildSearchParams (filtros) + limit/cursor (paginación backend)
      const baseURL = getApiBaseUrl();
      const searchParams = buildSearchParams(filters);
      searchParams.set("limit", String(safeLimit));
      searchParams.set("cursor", String(safeCursor));

      const endpoint = `${baseURL}/photos/getallphotos?${searchParams.toString()}`;

      // Logging detallado en desarrollo (solo si hay problemas)
      if (process.env.NODE_ENV === "development" && process.env.DEBUG_API === "true") {
        console.log("[API Server] ===== FETCH REQUEST =====");
        console.log("[API Server] Base URL:", baseURL);
        console.log("[API Server] Endpoint completo:", endpoint);
        console.log("[API Server] Filtros:", JSON.stringify(filters, null, 2));
        console.log("[API Server] Limit:", safeLimit, "Cursor:", safeCursor);
        console.log("[API Server] NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("[API Server] API_URL:", process.env.API_URL);
      }

      // ✅ Caching con ISR: Revalidar cada 6 horas (21600 segundos)
      // Tags permiten revalidación manual si es necesario
      const fetchOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        next: {
          revalidate: 21600, // 6 horas
          tags: ['vehicles-list'],
        },
      };

      // Fetch con timeout y caching automático de Next.js
      let response;
      try {
        response = await fetchWithTimeout(endpoint, fetchOptions);
        
        if (process.env.NODE_ENV === "development" && process.env.DEBUG_API === "true") {
          console.log("[API Server] ✅ Response recibida:", response.status, response.statusText);
        }
      } catch (fetchError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[API Server] ❌ Error en fetch:", fetchError);
          console.error("[API Server] Error name:", fetchError.name);
          console.error("[API Server] Error message:", fetchError.message);
          console.error("[API Server] Error code:", fetchError.code);
          console.error("[API Server] Error cause:", fetchError.cause);
        }
        throw fetchError;
      }

      if (!response.ok) {
        throw new Error(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Manejo de errores robusto
      const baseURL = getApiBaseUrl();
      const errorDetails = {
        message: error.message,
        baseURL,
        filters,
        limit,
        cursor,
      };

      // Logging más detallado en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.error("[API Server] Error fetching vehicles:", errorDetails);
        console.error("[API Server] Error completo:", error);
        
        // Mensaje más útil si el backend no está disponible
        if (
          error.message === "fetch failed" ||
          error.message?.includes("ECONNREFUSED") ||
          error.code === "ECONNREFUSED" ||
          error.cause?.code === "ECONNREFUSED"
        ) {
          console.warn(
            `[API Server] ⚠️  Backend no disponible en ${baseURL}. ` +
            `Asegúrate de que el backend esté corriendo y que NEXT_PUBLIC_API_URL esté configurado correctamente.`
          );
          console.warn(
            `[API Server] 💡 Verifica: ` +
            `1) Backend corriendo en puerto 3001, ` +
            `2) Variable NEXT_PUBLIC_API_URL=${process.env.NEXT_PUBLIC_API_URL}, ` +
            `3) Backend acepta conexiones desde localhost`
          );
        }
      }

      // Re-lanzar error con mensaje más claro
      const isConnectionError =
        error.message === "fetch failed" ||
        error.message?.includes("ECONNREFUSED") ||
        error.code === "ECONNREFUSED" ||
        error.cause?.code === "ECONNREFUSED" ||
        error.name === "TypeError";

      const enhancedError = new Error(
        isConnectionError
          ? `No se pudo conectar con el backend en ${baseURL}. Verifica que: 1) El backend esté corriendo, 2) NEXT_PUBLIC_API_URL esté configurado correctamente, 3) El backend acepte conexiones desde localhost.`
          : error.message
      );
      enhancedError.originalError = error;
      enhancedError.code = error.code || error.cause?.code;
      throw enhancedError;
    }
  },

  /**
   * Obtener vehículo por ID (Server Component)
   * 
   * @param {string|number} id - ID del vehículo
   * @returns {Promise<Object>} Vehículo del backend
   */
  async getVehicleById(id) {
    try {
      const isValidId =
        id !== null && id !== undefined && `${id}`.trim() !== "";

      if (!isValidId) {
        throw new Error("ID de vehículo inválido");
      }

      const baseURL = getApiBaseUrl();
      const endpoint = `${baseURL}/photos/getonephoto/${id}`;

      // Logging solo en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.debug("[API Server] Fetching vehicle:", endpoint);
      }

      // ✅ Caching con ISR: Revalidar cada 6 horas (21600 segundos)
      // Tags permiten revalidación manual por vehículo específico o todos
      const response = await fetchWithTimeout(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        next: {
          revalidate: 21600, // 6 horas
          tags: ['vehicle-detail', `vehicle:${id}`],
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vehículo no encontrado");
        }
        throw new Error(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // El backend puede retornar { getOnePhoto: {...} } o directamente el objeto
      const vehicle =
        data && data.getOnePhoto ? data.getOnePhoto : data;

      return vehicle;
    } catch (error) {
      // Manejo de errores robusto
      console.error("[API Server] Error fetching vehicle by ID:", {
        id,
        message: error.message,
      });

      throw error;
    }
  },
};

export default vehiclesService;

