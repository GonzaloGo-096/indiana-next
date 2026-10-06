/**
 * Arman los 3 datos del vehículo que viajan en view_item y whatsapp_click:
 * item_id, item_name, item_category. Con eso GA4 cruza "vistas" contra
 * "contactos" por auto. Nunca se pasa el objeto crudo.
 */

import { ITEM_CATEGORY } from "./events";

function clean(v) {
  return v == null ? "" : String(v).trim().slice(0, 100);
}

/** @param {{ slug?: string, id?: string, titulo?: string, nombre?: string, modelo?: string }} auto */
export function buildItemParamsFromAuto(auto) {
  const id = clean(auto?.slug || auto?.id);
  if (!id) return null;
  // Siempre con la marca: el título a veces viene solo ("Expert") y en los
  // reportes no se distinguía de un usado.
  const base = clean(auto.titulo || auto.nombre || auto.modelo);
  const name = !base ? id : base.toLowerCase().includes("peugeot") ? base : `Peugeot ${base}`;
  return { item_id: id, item_name: name, item_category: ITEM_CATEGORY.ZERO_KM };
}

/** @param {{ id?: string, slug?: string, nombre?: string, titulo?: string, modelo?: string }} plan */
export function buildItemParamsFromPlan(plan) {
  const id = clean(plan?.id || plan?.slug);
  if (!id) return null;
  // "Modelo · Plan": los nombres de plan a veces traen el modelo y a veces no
  // ("Easy" vs "2008 Active T200"); se antepone solo si falta.
  const modelo = clean(plan.modelo);
  const planName = clean(plan.nombre || plan.titulo);
  const modeloLabel = modelo ? modelo.charAt(0).toUpperCase() + modelo.slice(1) : "";
  const yaLoTiene = modelo && planName.toLowerCase().includes(modelo.toLowerCase());
  const name =
    modeloLabel && planName && !yaLoTiene
      ? `${modeloLabel} · ${planName}`
      : planName || modeloLabel || id;
  return { item_id: id, item_name: name, item_category: ITEM_CATEGORY.PLAN };
}

/** @param {{ slug?: string, id?: string, _id?: string, marca?: string, modelo?: string, anio?: string | number }} usado */
export function buildItemParamsFromUsado(usado) {
  const id = clean(usado?.slug || usado?.id || usado?._id);
  if (!id) return null;
  // Con el año: hay muchos "Peugeot 208" usados y sin él colapsan en una fila.
  const name = [usado.marca, usado.modelo, usado.anio].map(clean).filter(Boolean).join(" ") || id;
  return { item_id: id, item_name: name, item_category: ITEM_CATEGORY.USADO };
}
