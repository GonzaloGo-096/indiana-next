/**
 * Logger gateado por entorno.
 *
 * Niveles:
 *   - debug / info  → solo en desarrollo, o en producción si API_DEBUG === "true"
 *   - warn / error  → siempre (producción y desarrollo)
 *
 * Para activar logs detallados en producción sin redeploy de código:
 *   setear la env var `API_DEBUG=true` en Vercel y redeployar.
 *
 * Uso:
 *   import { createLogger } from "@/lib/logger";
 *   const log = createLogger("photos/create");
 *   log.debug("FormData entrante", { keys });
 *   log.warn("Header Authorization no encontrado");
 *   log.error("Error optimizando imagen", { fileName, errorMessage });
 */

function isVerboseEnabled() {
  // Se lee en cada llamada para que tests puedan mutar process.env.
  const env = (process.env.NODE_ENV || "").toLowerCase();
  if (env !== "production") return true;
  return process.env.API_DEBUG === "true";
}

/**
 * Costura para telemetría.
 *
 * Todo `log.error(...)` pasa por acá, así que enchufar un servicio de errores
 * (Sentry o el que sea) es registrar un reporter una sola vez, en vez de tocar
 * los ~24 sitios que hoy logean errores sueltos. Mientras no haya reporter,
 * el comportamiento es exactamente el de antes: escribir a consola.
 */
let errorReporter = null;

export function setErrorReporter(fn) {
  errorReporter = typeof fn === "function" ? fn : null;
}

function report(scope, args) {
  if (!errorReporter) return;
  try {
    errorReporter({ scope, args });
  } catch {
    // Un reporter roto no puede tumbar la app ni tapar el error original.
    // Es el único catch mudo justificado del proyecto.
  }
}

export function createLogger(scope) {
  const prefix = scope ? `[${scope}]` : "";

  return {
    debug: (...args) => {
      if (isVerboseEnabled()) console.log(prefix, ...args);
    },
    info: (...args) => {
      if (isVerboseEnabled()) console.log(prefix, ...args);
    },
    warn: (...args) => {
      console.warn(prefix, ...args);
    },
    error: (...args) => {
      console.error(prefix, ...args);
      report(scope, args);
    },
  };
}
