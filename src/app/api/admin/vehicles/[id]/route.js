/**
 * API Route: /api/admin/vehicles/[id]
 *
 *   DELETE → borra un auto              (backend: DELETE /photos/deletephoto/:id)
 *   PATCH  → cambia su estado, { estado } (backend: PATCH /photos/updatestatus/:id)
 *
 * El navegador le pide a este servidor y este reenvía al backend, llevando la
 * credencial del panel.
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
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/api";
import { createLogger } from "@/lib/logger";
import { ESTADOS } from "@/utils/vehicleEstado";

const log = createLogger("api:admin:vehicles");

const TIMEOUT_MS = 15000;

/** Un id de Mongo es exactamente 24 caracteres hexadecimales. */
const RE_OBJECT_ID = /^[a-fA-F0-9]{24}$/;

const ESTADOS_VALIDOS = Object.values(ESTADOS);

const error = (status, msg) => NextResponse.json({ error: true, msg }, { status });

function esRutaInexistente(contentType, cuerpo) {
  if (!contentType.includes("application/json")) return true;
  try {
    return JSON.parse(cuerpo)?.msg === "Ruta no encontrada";
  } catch {
    return true; // dice ser JSON y no lo es: tampoco es la respuesta de la operación
  }
}

/**
 * Lo común a todos los pedidos: credencial, id y reenvío.
 * `accion` es solo para los logs y los mensajes ("borrar", "cambiar el estado de").
 */
async function reenviar(request, params, { accion, method, path, body }) {
  const { id } = await params;
  const idLimpio = String(id ?? "").trim();

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  // Sin credencial no se reenvía nada: el backend respondería 401 igual, pero
  // este viaje no hace falta hacerlo.
  if (!token) return error(401, "Falta la credencial de administrador");

  // Un id con basura pegada llegaría al backend y ahí fallaría de forma menos
  // clara. Se corta acá, que es donde se sabe qué forma tiene que tener.
  if (!RE_OBJECT_ID.test(idLimpio)) {
    log.warn(`ID de auto inválido al ${accion}: "${idLimpio.slice(0, 40)}"`);
    return error(400, "ID de auto inválido");
  }

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}${path(idLimpio)}`, {
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
      log.error(`El backend respondió ${respuesta.status} al ${accion} ${idLimpio}`);
    } else {
      log.info(`${accion} ${idLimpio}: ok`);
    }

    // Un 404 puede ser "ese auto no existe" o "esa operación no existe". El
    // segundo pasa con un backend que todavía no la tiene, como el de
    // producción antes de que publiquen los estados. Se reconoce por el
    // cuerpo: el backend de producción responde { msg: "Ruta no encontrada" }
    // (verificado el 2026-09-24) y Express sin ese manejador, una página HTML.
    if (respuesta.status === 404 && esRutaInexistente(contentType, cuerpo)) {
      return error(501, `El backend todavía no permite ${accion} un auto.`);
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
    log.error(`No se pudo ${accion} ${idLimpio}:`, e?.message || e);

    return error(
      esTimeout ? 504 : 502,
      esTimeout
        ? `El backend no respondió a tiempo. Puede que no se haya podido ${accion} el auto.`
        : "No se pudo conectar con el backend.",
    );
  }
}

export function DELETE(request, { params }) {
  return reenviar(request, params, {
    accion: "borrar",
    method: "DELETE",
    path: (id) => `/photos/deletephoto/${id}`,
  });
}

export async function PATCH(request, { params }) {
  const datos = await request.json().catch(() => null);
  const estado = typeof datos?.estado === "string" ? datos.estado : "";

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return error(400, `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);
  }

  return reenviar(request, params, {
    accion: "cambiar el estado de",
    method: "PATCH",
    path: (id) => `/photos/updatestatus/${id}`,
    body: { estado },
  });
}
