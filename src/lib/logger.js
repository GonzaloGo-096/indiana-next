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
    },
  };
}
