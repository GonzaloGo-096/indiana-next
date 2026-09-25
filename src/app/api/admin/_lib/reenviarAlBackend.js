/**
 * Reenvío al backend de los pedidos del panel admin.
 *
 * Lo usan todas las rutas de /api/admin que operan sobre autos. El navegador le
 * pide a este servidor y este reenvía al backend llevando la credencial del
 * panel.
 *
 * POR QUÉ EXISTE
 * Mismo motivo que /api/admin/login: el pedido salía directo del navegador
 * hacia otro dominio, y el navegador lo corta si ese dominio no autoriza el
 * origen. Ver el comentario largo en /api/admin/login/route.js.
 *
 * QUIÉN AUTORIZA
 * El backend, como siempre. Acá no se valida la credencial: se comprueba que
 * venga y se reenvía. Validarla de este lado significaría un viaje extra al
 * backend por cada pedido, para terminar preguntándole lo mismo que va a
 * responder igual. Lo único que sí se hace es cortar los pedidos que ni
 * siquiera traen credencial, que no tiene sentido reenviar.
 *
 * (La carpeta empieza con "_" para que Next no la publique como ruta.)
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:admin");

const TIMEOUT_MS = 15000;

export const respuestaDeError = (status, msg) =>
  NextResponse.json({ error: true, msg }, { status });

/** Un 404 del backend puede ser "ese auto no existe" o "esa operación no existe". */
function esRutaInexistente(contentType, cuerpo) {
  if (!contentType.includes("application/json")) return true;
  try {
    return JSON.parse(cuerpo)?.msg === "Ruta no encontrada";
  } catch {
    return true; // dice ser JSON y no lo es: tampoco es la respuesta de la operación
  }
}

/**
 * @param {Request} request - El pedido del panel (de ahí sale la credencial).
 * @param {Object} opciones
 * @param {string} opciones.accion - Para logs y mensajes, en infinitivo y
 *   completa: "borrar un auto", "listar los autos del panel".
 * @param {string} opciones.method
 * @param {string} opciones.path - Ruta del backend, ya armada y validada.
 * @param {Object} [opciones.body] - Se manda como JSON.
 */
export async function reenviarAlBackend(request, { accion, method, path, body }) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  // Sin credencial no se reenvía nada: el backend respondería 401 igual, pero
  // este viaje no hace falta hacerlo.
  if (!token) return respuestaDeError(401, "Falta la credencial de administrador");

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    const contentType = respuesta.headers.get("content-type") || "";
    const cuerpo = await respuesta.text();

    if (!respuesta.ok) {
      log.error(`El backend respondió ${respuesta.status} al ${accion} (${method} ${path})`);
    } else {
      log.info(`${accion}: ok (${method} ${path})`);
    }

    // Se reconoce por el cuerpo: el backend responde { msg: "Ruta no
    // encontrada" } (verificado el 2026-09-24) y Express sin ese manejador,
    // una página HTML. Pasa con un backend desactualizado respecto del panel.
    if (respuesta.status === 404 && esRutaInexistente(contentType, cuerpo)) {
      return respuestaDeError(501, `El backend todavía no permite ${accion}.`);
    }

    return new NextResponse(cuerpo, {
      status: respuesta.status,
      headers: {
        "Content-Type": contentType || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const esTimeout = e?.name === "TimeoutError" || e?.name === "AbortError";
    log.error(`No se pudo ${accion} (${method} ${path}):`, e?.message || e);

    return respuestaDeError(
      esTimeout ? 504 : 502,
      esTimeout
        ? `El backend no respondió a tiempo. Puede que no se haya podido ${accion}.`
        : "No se pudo conectar con el backend.",
    );
  }
}
