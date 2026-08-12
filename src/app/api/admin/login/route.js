/**
 * API Route: POST /api/admin/login
 *
 * El navegador manda las credenciales acá, y este servidor las reenvía al
 * backend. Devuelve la respuesta del backend tal cual (incluido el token).
 *
 * POR QUÉ EXISTE
 * Antes el navegador le hablaba directo al backend, que vive en otro dominio.
 * Los navegadores no permiten eso salvo que el servidor de destino autorice
 * expresamente al origen que pregunta. El backend de preview dejó de autorizar
 * a nadie —verificado el 2026-08-12: ni localhost, ni el sitio real, ni él
 * mismo—, así que el navegador cortaba el pedido antes de que saliera y el
 * panel era inusable desde cualquier máquina.
 *
 * Server-to-server no tiene esa restricción: es una regla del navegador, no de
 * la red. Pasando por acá el login funciona sin importar cómo esté configurado
 * el backend en cada entorno, ahora y más adelante.
 *
 * Mismo patrón que /api/catalogo, /api/photos/create y /api/photos/update.
 *
 * DE PASO, DOS COSAS QUE ANTES NO HABÍA
 * - Freno a la fuerza bruta. Yendo directo al backend, cualquiera podía probar
 *   contraseñas al ritmo que quisiera.
 * - El backend deja de quedar expuesto como destino de login desde el navegador.
 *
 * @author Indiana Peugeot
 */

import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/api";
import { crearRateLimit } from "@/lib/http/rateLimit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:admin:login");

/** Ruta del backend. El navegador ya no la conoce. */
const RUTA_BACKEND = "/user/loginuser";

const TIMEOUT_MS = 15000;

// 10 intentos cada 5 minutos por IP: de sobra para alguien que se equivoca al
// tipear, inservible para probar contraseñas a máquina.
const limitarLogin = crearRateLimit({ ventanaMs: 5 * 60_000, maxIntentos: 10 });

export async function POST(request) {
  const limite = limitarLogin(request);
  if (!limite.ok) {
    log.warn("Demasiados intentos de login desde una misma IP");
    return NextResponse.json(
      {
        error: true,
        msg: `Demasiados intentos. Probá de nuevo en ${limite.retryAfter} segundos.`,
      },
      { status: 429, headers: { "Retry-After": String(limite.retryAfter) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: true, msg: "Pedido inválido" },
      { status: 400 },
    );
  }

  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  // Se corta acá para no gastar un viaje al backend con un formulario vacío.
  if (!username || !password) {
    return NextResponse.json(
      { error: true, msg: "Usuario y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const respuesta = await fetch(`${getApiBaseUrl()}${RUTA_BACKEND}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Se reenvía solo usuario y contraseña: nada más de lo que haya mandado
      // el navegador viaja al backend.
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    const cuerpo = await respuesta.text();

    // Nunca se registra la contraseña. El usuario sí: sin eso, diagnosticar un
    // "credenciales inválidas" es adivinar.
    if (!respuesta.ok) {
      log.warn(`El backend rechazó el login de "${username}" (${respuesta.status})`);
    }

    return new NextResponse(cuerpo, {
      status: respuesta.status,
      headers: {
        "Content-Type":
          respuesta.headers.get("content-type") || "application/json",
        // Un token no se guarda en ninguna caché intermedia.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const esTimeout =
      error?.name === "TimeoutError" || error?.name === "AbortError";
    log.error("No se pudo consultar el backend:", error?.message || error);

    return NextResponse.json(
      {
        error: true,
        msg: esTimeout
          ? "El backend no respondió a tiempo. Probá de nuevo."
          : "No se pudo conectar con el backend.",
      },
      { status: esTimeout ? 504 : 502 },
    );
  }
}
