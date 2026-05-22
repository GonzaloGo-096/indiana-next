/**
 * cloudinary.js - Helper para generar URLs de Cloudinary con transformaciones.
 *
 * Uso básico:
 *   cl(url, { w: 828 })
 *   cl(url, { w: 1920, q: "auto:good" })
 *
 * - Si la URL no es de Cloudinary, la devuelve sin tocar (seguro para llamar siempre).
 * - No duplica transformaciones: inserta el bloque justo después de /image/upload/.
 * - Por defecto: f_auto (AVIF/WebP según Accept), q_auto:eco, dpr_auto.
 *
 * @param {string} url - URL completa de Cloudinary.
 * @param {{ w?: number, h?: number, q?: string|number, fmt?: string, crop?: string, dpr?: string }} [opts]
 * @returns {string} URL con transformaciones insertadas.
 */
export function cl(url, { w, h, q = "auto:eco", fmt = "auto", crop, dpr = "auto" } = {}) {
  if (!url || typeof url !== "string") return url || "";
  if (!url.includes("res.cloudinary.com")) return url;

  const parts = [
    `f_${fmt}`,
    `q_${q}`,
    w && `w_${w}`,
    h && `h_${h}`,
    (w || h) && crop ? `c_${crop}` : null,
    `dpr_${dpr}`,
  ].filter(Boolean).join(",");

  return url.replace(/\/image\/upload\//, `/image/upload/${parts}/`);
}
