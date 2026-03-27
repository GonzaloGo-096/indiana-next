export const MAINTENANCE_BYPASS_COOKIE = "maintenance_bypass";
export const MAINTENANCE_PAGE_PATH = "/mantenimiento";

/**
 * Mantenimiento activo solo con MAINTENANCE_MODE=true.
 * En desarrollo (next dev) se ignora salvo MAINTENANCE_MODE_DEV=true,
 * para poder trabajar en local aunque .env.local tenga el flag de producción.
 */
export function isMaintenanceEnabled() {
  if (process.env.MAINTENANCE_MODE !== "true") {
    return false;
  }
  if (process.env.NODE_ENV !== "production") {
    return process.env.MAINTENANCE_MODE_DEV === "true";
  }
  return true;
}

export function getRetryAfterSeconds() {
  const raw = process.env.MAINTENANCE_RETRY_AFTER || "3600";
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? String(value) : "3600";
}

export function isValidBypassToken(token) {
  const configured = (process.env.MAINTENANCE_BYPASS_TOKEN || "").trim();
  return configured.length > 0 && token === configured;
}
