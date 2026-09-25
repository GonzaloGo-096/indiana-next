/**
 * API Route: /api/admin/vehicles/[id]
 *
 *   DELETE → borra un auto                (backend: DELETE /photos/deletephoto/:id)
 *   PATCH  → cambia su estado, { estado } (backend: PATCH /photos/updatestatus/:id)
 *
 * Credencial, reenvío y errores: ver ../../_lib/reenviarAlBackend.js.
 */

import { createLogger } from "@/lib/logger";
import { ESTADOS } from "@/utils/vehicleEstado";
import { reenviarAlBackend, respuestaDeError } from "../../_lib/reenviarAlBackend";

const log = createLogger("api:admin:vehicles");

/** Un id de Mongo es exactamente 24 caracteres hexadecimales. */
const RE_OBJECT_ID = /^[a-fA-F0-9]{24}$/;

const ESTADOS_VALIDOS = Object.values(ESTADOS);

/**
 * Un id con basura pegada llegaría al backend y ahí fallaría de forma menos
 * clara. Se corta acá, que es donde se sabe qué forma tiene que tener.
 * @returns {Promise<string|null>} el id limpio, o null si no es válido
 */
async function idValido(params, accion) {
  const { id } = await params;
  const idLimpio = String(id ?? "").trim();
  if (RE_OBJECT_ID.test(idLimpio)) return idLimpio;
  log.warn(`ID de auto inválido al ${accion}: "${idLimpio.slice(0, 40)}"`);
  return null;
}

export async function DELETE(request, { params }) {
  const accion = "borrar un auto";
  const id = await idValido(params, accion);
  if (!id) return respuestaDeError(400, "ID de auto inválido");

  return reenviarAlBackend(request, {
    accion,
    method: "DELETE",
    path: `/photos/deletephoto/${id}`,
  });
}

export async function PATCH(request, { params }) {
  const datos = await request.json().catch(() => null);
  const estado = typeof datos?.estado === "string" ? datos.estado : "";

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return respuestaDeError(400, `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}`);
  }

  const accion = "cambiar el estado de un auto";
  const id = await idValido(params, accion);
  if (!id) return respuestaDeError(400, "ID de auto inválido");

  return reenviarAlBackend(request, {
    accion,
    method: "PATCH",
    path: `/photos/updatestatus/${id}`,
    body: { estado },
  });
}
