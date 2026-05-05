/**
 * Builders de parámetros estandarizados.
 *
 * Allowlist estricta: nunca pasar el objeto crudo (auto/plan/usado).
 * Solo los campos del schema.
 *
 * Schema "item" (compatible con GA4 e-commerce):
 * { item_id, item_name, item_category, item_brand,
 *   item_variant?, price?, currency: "ARS", item_list_name? }
 */

import { ITEM_CATEGORY } from "./events";

const CURRENCY_ARS = "ARS";

function toCleanString(v, max = 100) {
  if (v == null) return "";
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function toNumberOrNull(v) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pruneNulls(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === null || v === undefined || v === "") continue;
    out[k] = v;
  }
  return out;
}

/**
 * Auto 0km (modelo Peugeot).
 * @param {object} auto - debe tener al menos { slug | id, titulo | nombre, versiones?, precio? }
 * @param {string} [listName]
 */
export function buildItemParamsFromAuto(auto, listName) {
  if (!auto || typeof auto !== "object") return null;
  const id = toCleanString(auto.slug || auto.id);
  const name = toCleanString(auto.titulo || auto.nombre || auto.modelo || id);
  if (!id) return null;
  // item_category se asigna FUERA de pruneNulls para garantizar que nunca sea
  // eliminada (pruneNulls descarta null/undefined/"") ni llegue como null al dataLayer.
  return {
    ...pruneNulls({
      item_id: id,
      item_name: name,
      item_brand: "Peugeot",
      item_variant: toCleanString(
        Array.isArray(auto.versiones) ? auto.versiones.join("/") : auto.version,
      ),
      price: toNumberOrNull(auto.precio || auto.price),
      currency: CURRENCY_ARS,
      item_list_name: toCleanString(listName),
    }),
    item_category: ITEM_CATEGORY.ZERO_KM || "0km",
  };
}

/**
 * Plan de financiación.
 * @param {object} plan - { id, nombre | titulo, modelo?, cuota? }
 * @param {string} [listName]
 */
export function buildItemParamsFromPlan(plan, listName) {
  if (!plan || typeof plan !== "object") return null;
  const id = toCleanString(plan.id || plan.slug);
  const name = toCleanString(plan.nombre || plan.titulo || id);
  if (!id) return null;
  return {
    ...pruneNulls({
      item_id: id,
      item_name: name,
      item_brand: "Peugeot",
      item_variant: toCleanString(plan.modelo || plan.variant),
      price: toNumberOrNull(plan.cuota || plan.precio || plan.price),
      currency: CURRENCY_ARS,
      item_list_name: toCleanString(listName),
    }),
    item_category: ITEM_CATEGORY.PLAN || "plan",
  };
}

/**
 * Vehículo usado (multimarca).
 * @param {object} usado - { id | _id, slug?, marca, modelo, version?, precio?, anio?, kilometraje? }
 * @param {string} [listName]
 */
export function buildItemParamsFromUsado(usado, listName) {
  if (!usado || typeof usado !== "object") return null;
  const id = toCleanString(usado.slug || usado.id || usado._id);
  if (!id) return null;
  const marca = toCleanString(usado.marca);
  const modelo = toCleanString(usado.modelo);
  const name = [marca, modelo].filter(Boolean).join(" ") || id;
  return {
    ...pruneNulls({
      item_id: id,
      item_name: name,
      item_brand: marca || "multimarca",
      item_variant: toCleanString(usado.version),
      price: toNumberOrNull(usado.precio || usado.price),
      currency: CURRENCY_ARS,
      item_list_name: toCleanString(listName),
    }),
    item_category: ITEM_CATEGORY.USADO || "usado",
  };
}

/**
 * Hash sha256 corto del número (sin '+' ni espacios) para identificar destinos
 * sin guardar el número en claro. NO es PII en GA4 (es un identificador opaco).
 * Usa SubtleCrypto si está disponible; si no, devuelve null silenciosamente.
 * @returns {Promise<string|null>}
 */
export async function hashPhoneNumber(phone) {
  if (typeof phone !== "string" || phone.length === 0) return null;
  if (
    typeof window === "undefined" ||
    !window.crypto ||
    !window.crypto.subtle
  ) {
    return null;
  }
  try {
    const normalized = phone.replace(/[^\d]/g, "");
    if (!normalized) return null;
    const buf = new TextEncoder().encode(normalized);
    const digest = await window.crypto.subtle.digest("SHA-256", buf);
    const bytes = new Uint8Array(digest);
    let hex = "";
    for (let i = 0; i < 8; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex; // 16 hex chars (8 bytes), suficiente para identificar destinos
  } catch {
    return null;
  }
}

/**
 * Acota un objeto de filtros de usados a las claves conocidas y al tipo correcto.
 * @param {object} filters
 */
export function buildSearchFiltersParams(filters) {
  if (!filters || typeof filters !== "object") return {};
  const out = {};
  if (filters.marca) out.marca = toCleanString(filters.marca, 50);
  const precioMin = toNumberOrNull(filters.precio_min ?? filters.precioMin);
  const precioMax = toNumberOrNull(filters.precio_max ?? filters.precioMax);
  const kmMax = toNumberOrNull(filters.km_max ?? filters.kmMax);
  if (precioMin !== null) out.precio_min = precioMin;
  if (precioMax !== null) out.precio_max = precioMax;
  if (kmMax !== null) out.km_max = kmMax;
  if (filters.combustible) out.combustible = toCleanString(filters.combustible, 30);
  if (filters.caja) out.caja = toCleanString(filters.caja, 30);
  out.filters_count = Object.keys(out).length;
  return out;
}
