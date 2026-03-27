/**
 * vehicleSlug.js - Utilidades para URLs de detalle de vehículos (slug + id)
 *
 * Funciones puras para generar y parsear URLs del tipo:
 * /usados/peugeot-208-allure-2021-699e2aa373f578ed9ede40cf
 *
 * @author Indiana Peugeot
 * @version 1.0.0
 */

/**
 * Convierte un string en formato URL-safe (minúsculas, sin tildes, guiones).
 *
 * @param {string|null|undefined} text - Texto a convertir
 * @returns {string}
 *
 * @example
 * slugify("Peugeot 208")        // "peugeot-208"
 * slugify("Citroën C4 Cactus")  // "citroen-c4-cactus"
 * slugify(null)                 // ""
 */
export function slugify(text) {
  if (text == null || typeof text !== "string") return "";

  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Construye la URL canónica del detalle de un vehículo.
 *
 * @param {Object} vehicle - Vehículo con id/_id y opcionalmente marca, modelo, version, anio
 * @returns {string} - URL relativa (ej: /usados/peugeot-208-allure-2021-699e2aa373f578ed9ede40cf)
 * @throws {Error} Si no hay id ni _id
 *
 * @example
 * buildVehicleDetailUrl({ id: "abc123", marca: "Peugeot", modelo: "208", anio: 2021 })
 * // "/usados/peugeot-208-2021-abc123"
 */
export function buildVehicleDetailUrl(vehicle) {
  if (!vehicle || typeof vehicle !== "object") {
    throw new Error("[vehicleSlug] buildVehicleDetailUrl: vehicle es requerido");
  }

  const id = vehicle.id ?? vehicle._id;
  if (id == null || String(id).trim() === "") {
    throw new Error("[vehicleSlug] buildVehicleDetailUrl: vehicle debe tener id o _id");
  }

  const idStr = slugSegmentSinBasura(String(id));
  const anio = vehicle.anio ?? vehicle.año;
  const parts = [vehicle.marca, vehicle.modelo, vehicle.version, anio]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => slugify(String(v)))
    .filter(Boolean);

  const slugPart = parts.join("-");
  return slugPart ? `/usados/${slugPart}-${idStr}` : `/usados/${idStr}`;
}

/** Regex: 24 caracteres hex al final, precedidos por guión (slug-id). Case-insensitive (MongoDB ObjectId). */
const SLUG_ID_REGEX = /-([a-fA-F0-9]{24})$/i;

/** Regex: string completo es exactamente 24 hex (URL vieja). Case-insensitive (MongoDB ObjectId). */
const ID_ONLY_REGEX = /^[a-fA-F0-9]{24}$/i;

/**
 * Quita texto accidental pegado al slug (espacios, frases copiadas del chat, etc.).
 * Ej: "peugeot-208-2017-699e29... Si ahí tam" → "peugeot-208-2017-699e29..."
 */
function slugSegmentSinBasura(raw) {
  if (raw == null || typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  return t.split(/\s+/)[0] || t;
}

/**
 * Interpreta el segmento dinámico de la URL (/usados/[param]).
 *
 * @param {string|null|undefined} param - Segmento de URL (ej: "peugeot-208-...-699e2aa373f578ed9ede40cf")
 * @returns {{ id: string|null, needsRedirect: boolean }}
 *
 * @example
 * parseVehicleSlugParam("699e2aa373f578ed9ede40cf")
 * // { id: "699e2aa373f578ed9ede40cf", needsRedirect: true }
 *
 * parseVehicleSlugParam("peugeot-208-allure-2021-699e2aa373f578ed9ede40cf")
 * // { id: "699e2aa373f578ed9ede40cf", needsRedirect: false }
 */
export function parseVehicleSlugParam(param) {
  if (param == null || typeof param !== "string") {
    return { id: null, needsRedirect: false };
  }

  const trimmed = slugSegmentSinBasura(param);

  // URL vieja: solo ID (24 hex). Normalizar a minúscula (backend espera lowercase).
  if (ID_ONLY_REGEX.test(trimmed)) {
    return { id: trimmed.toLowerCase(), needsRedirect: true };
  }

  // URL nueva: slug-id (id al final)
  const match = trimmed.match(SLUG_ID_REGEX);
  if (match) {
    return { id: match[1].toLowerCase(), needsRedirect: false };
  }

  return { id: null, needsRedirect: false };
}

/*
 * EJEMPLOS DE USO:
 *
 * slugify("Peugeot 208")                    // "peugeot-208"
 * slugify("Citroën C4 Cactus")              // "citroen-c4-cactus"
 * slugify(null)                             // ""
 *
 * buildVehicleDetailUrl({
 *   id: "699e2aa373f578ed9ede40cf",
 *   marca: "Peugeot",
 *   modelo: "208",
 *   version: "Allure",
 *   anio: 2021
 * })                                        // "/usados/peugeot-208-allure-2021-699e2aa373f578ed9ede40cf"
 *
 * parseVehicleSlugParam("699e2aa373f578ed9ede40cf")
 *   // { id: "699e2aa373f578ed9ede40cf", needsRedirect: true }
 *
 * parseVehicleSlugParam("peugeot-208-allure-2021-699e2aa373f578ed9ede40cf")
 *   // { id: "699e2aa373f578ed9ede40cf", needsRedirect: false }
 */
