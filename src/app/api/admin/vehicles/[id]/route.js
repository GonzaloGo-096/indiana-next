/**
 * API Route: DELETE /api/admin/vehicles/[id]
 *
 * Borra un auto. El navegador le pide a este servidor y este reenvía al
 * backend, llevando la credencial del panel.
 *
 * POR QUÉ EXISTE
 * Mismo motivo que /api/admin/login: el borrado salía directo del navegador
 * hacia otro dominio, y el navegador lo corta si ese dominio no autoriza el
 * origen. Ver el comentario largo en /api/admin/login/route.js.
 *
 * QUIÉN AUTORIZA
 * El backend, como siempre. Acá no se valida la credencial: se comprueba que
 * venga y se reenvía. Validarla de este lado significaría un viaje extra al
 * backend por cada borrado, para terminar preguntándole lo mismo que va a
 * responder igual. Lo único que sí se hace es cortar los pedidos que ni
 * siquiera traen credencial, que no tiene sentido reenviar.
 *
 * @author Indiana Peugeot
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:admin:vehicles");

const TIMEOUT_MS = 15000;

/** Un id de Mongo es exactamente 24 caracteres hexadecimales. */
const RE_OBJECT_ID = /^[a-fA-F0-9]{24}$/;

export async function DELETE(request, { params }) {
  const { id } = await params;
  const idLimpio = String(id ?? "").trim();

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  // Sin credencial no se reenvía nada: el backend respondería 401 igual, pero
  // este viaje no hace falta hacerlo.
  if (!token) {
    return NextResponse.json(
      { error: true, msg: "Falta la credencial de administrador" },
      { status: 401 },
    );
  }

  // Un id con basura pegada llegaría al backend y ahí fallaría de forma menos
  // clara. Se corta acá, que es donde se sabe qué forma tiene que tener.
  if (!RE_OBJECT_ID.test(idLimpio)) {
    log.warn(`ID de auto inválido en un borrado: "${idLimpio.slice(0, 40)}"`);
    return NextResponse.json(
      { error: true, msg: "ID de auto inválido" },
      { status: 400 },
    );
  }

  try {
    const respuesta = await fetch(
      `${getApiBaseUrl()}/photos/deletephoto/${idLimpio}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      },
    );

    const cuerpo = await respuesta.text();

    if (!respuesta.ok) {
      log.error(`El backend respondió ${respuesta.status} al borrar ${idLimpio}`);
    } else {
      log.info(`Auto ${idLimpio} borrado`);
    }

    return new NextResponse(cuerpo, {
      status: respuesta.status,
      headers: {
        "Content-Type":
          respuesta.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const esTimeout =
      error?.name === "TimeoutError" || error?.name === "AbortError";
    log.error(`No se pudo borrar ${idLimpio}:`, error?.message || error);

    return NextResponse.json(
      {
        error: true,
        msg: esTimeout
          ? "El backend no respondió a tiempo. El auto puede no haberse borrado."
          : "No se pudo conectar con el backend.",
      },
      { status: esTimeout ? 504 : 502 },
    );
  }
}
