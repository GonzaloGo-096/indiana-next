/**
 * Clona un vehículo para pasarlo de Server Component a Client Component (Flight).
 * JSON es el subconjunto que React puede serializar de forma fiable; evita 500 por
 * referencias circulares o tipos no soportados si el API devuelve algo raro.
 */
export function serializeVehicleForClient(vehicle) {
  if (vehicle == null || typeof vehicle !== "object") {
    return vehicle;
  }
  try {
    return JSON.parse(
      JSON.stringify(vehicle, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  } catch {
    return null;
  }
}
