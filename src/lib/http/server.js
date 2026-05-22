/**
 * server.js - Utilidades HTTP para Server Components y API Routes
 *
 * fetchWithTimeout: fetch con timeout y fallback localhost → 127.0.0.1
 *
 * @author Indiana Peugeot
 * @version 1.0.0 - Fase 2 refactor
 */

import { getApiTimeout } from "@/lib/config/api";

/**
 * Fetch con timeout usando AbortController
 *
 * En Next.js Server Components, fetch puede tener problemas con localhost.
 * Si falla, intenta con 127.0.0.1 como fallback.
 *
 * @param {string} url - URL a fetch
 * @param {RequestInit} options - Opciones de fetch
 * @returns {Promise<Response>} Response del fetch
 */
export async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getApiTimeout());

  // En dev: forzar no-store solo si el caller no configuró ISR (next.revalidate).
  // Así en dev los datos son siempre frescos sin romper el contrato de cache del caller.
  // En prod: respetar exactamente lo que pasa el caller (ISR u otras directivas).
  const devCacheOverride =
    process.env.NODE_ENV === "development" && !options.next?.revalidate
      ? { cache: "no-store" }
      : {};

  try {
    const response = await fetch(url, {
      ...options,
      ...devCacheOverride,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (
      (error.message === "fetch failed" || error.code === "ECONNREFUSED") &&
      url.includes("localhost")
    ) {
      try {
        const fallbackUrl = url.replace("localhost", "127.0.0.1");
        if (process.env.NODE_ENV === "development") {
          console.log(`[API Server] Intentando con fallback: ${fallbackUrl}`);
        }

        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(
          () => fallbackController.abort(),
          getApiTimeout()
        );

        const response = await fetch(fallbackUrl, {
          ...options,
          ...devCacheOverride,
          signal: fallbackController.signal,
        });
        clearTimeout(fallbackTimeoutId);
        return response;
      } catch (fallbackError) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout: ${getApiTimeout()}ms`);
        }
        throw error;
      }
    }

    if (error.name === "AbortError") {
      throw new Error(`Request timeout: ${getApiTimeout()}ms`);
    }
    throw error;
  }
}
