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

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache:
        process.env.NODE_ENV === "development" ? "no-store" : undefined,
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
          signal: fallbackController.signal,
          cache: "no-store",
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
