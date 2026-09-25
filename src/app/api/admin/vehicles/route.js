/**
 * API Route: GET /api/admin/vehicles
 *
 * Lista de autos del panel (backend: GET /photos/getallphotos/private).
 *
 * A diferencia de la lista pública, incluye los PAUSADOS: el panel tiene que
 * verlos para poder reactivarlos. Por eso va con credencial y sin caché, y no
 * por /api/catalogo, que es de lectura pública.
 *
 * Solo pasan los parámetros que el backend entiende (filtros y paginado): el
 * resto se descarta, para que esta ruta no sea un reenvío abierto.
 *
 * Credencial, reenvío y errores: ver ../_lib/reenviarAlBackend.js.
 */

import { reenviarAlBackend } from "../_lib/reenviarAlBackend";

export const PARAMETROS_PERMITIDOS = [
  "marca",
  "caja",
  "combustible",
  "km",
  "precio",
  "anio",
  "limit",
  "cursor",
];

export function GET(request) {
  const entrada = new URL(request.url).searchParams;
  const salida = new URLSearchParams();
  for (const clave of PARAMETROS_PERMITIDOS) {
    const valor = entrada.get(clave);
    if (valor != null && valor !== "") salida.set(clave, valor);
  }

  const query = salida.toString();
  return reenviarAlBackend(request, {
    accion: "listar los autos del panel",
    method: "GET",
    path: `/photos/getallphotos/private${query ? `?${query}` : ""}`,
  });
}
