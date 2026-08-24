/**
 * API Route: /api/catalogo/[...path]
 *
 * Proxy de LECTURA del catálogo público. El navegador le pide a nuestro propio
 * servidor y este reenvía al backend.
 *
 * POR QUÉ EXISTE
 * El listado de usados filtra desde el navegador (useVehiclesList), igual que
 * los carruseles de similares y precio. Esos pedidos iban directo al backend,
 * que es el único punto del sitio donde el navegador le habla a otro dominio.
 * Si ese backend no autoriza el origen, el navegador descarta la respuesta y
 * la página muestra "Network Error": es lo que pasa hoy en desarrollo, donde
 * el backend de preview no manda Access-Control-Allow-Origin.
 *
 * Pasando por acá el problema desaparece de raíz: server-to-server no tiene
 * esa restricción. Y deja de depender de cómo esté configurado el backend en
 * cada entorno.
 *
 * Es el mismo patrón que ya usaban /api/photos/create y /api/photos/update.
 *
 * ALCANCE DELIBERADAMENTE ANGOSTO
 * Un proxy abierto dejaría que cualquiera use nuestro servidor para pegarle al
 * backend. Por eso: solo GET, solo las dos rutas de lectura que el cliente
 * necesita, y sin reenviar credenciales (son datos públicos).
 *
 * @author Indiana Peugeot
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/api";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:catalogo");

/** Timeout alineado con el resto de los llamados al backend. */
const TIMEOUT_MS = 15000;

/**
 * Rutas de lectura permitidas. Cualquier otra cosa se rechaza.
 * - photos/getallphotos          → listado con filtros
 * - photos/getonephoto/<24 hex>  → una ficha
 */
const RUTAS_PERMITIDAS = [
  /^photos\/getallphotos$/,
  /^photos\/getonephoto\/[a-fA-F0-9]{24}$/,
];

function rutaPermitida(path) {
  return RUTAS_PERMITIDAS.some((re) => re.test(path));
}

export async function GET(request, { params }) {
  const { path } = await params;
  const ruta = Array.isArray(path) ? path.join("/") : String(path || "");

  if (!rutaPermitida(ruta)) {
    log.warn(`Ruta no permitida: ${ruta}`);
    return NextResponse.json(
      { error: "Ruta no permitida" },
      { status: 404 },
    );
  }

  const query = new URL(request.url).search;
  const destino = `${getApiBaseUrl()}/${ruta}${query}`;

  try {
    const respuesta = await fetch(destino, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Sin caché de Next: la frescura de este camino la maneja el cliente.
      // El camino server (vehiclesApi.server) sí cachea con tags.
      cache: "no-store",
    });

    const cuerpo = await respuesta.text();

    if (!respuesta.ok) {
      log.error(`El backend respondió ${respuesta.status} en ${ruta}`);
    }

    return new NextResponse(cuerpo, {
      status: respuesta.status,
      headers: {
        "Content-Type":
          respuesta.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    const esTimeout = error.name === "TimeoutError" || error.name === "AbortError";
    log.error(`No se pudo consultar el catálogo (${ruta}):`, error?.message || error);

    return NextResponse.json(
      {
        error: esTimeout ? "Timeout" : "Error consultando el catálogo",
        message: esTimeout
          ? "El backend no respondió a tiempo."
          : "No se pudo obtener la información.",
      },
      { status: esTimeout ? 504 : 502 },
    );
  }
}
