/**
 * imageLoader.js - Loader de imágenes de Next que delega el resize a Cloudinary.
 *
 * Se conecta vía next.config.mjs → images.loaderFile.
 * Reemplaza al optimizador de Vercel (/_next/image): el srcset apunta
 * directo a Cloudinary con f_auto,q_<q>,c_limit,w_<ancho>. Costo Vercel = $0.
 *
 * Contrato Next 16: export default ({ src, width, quality }) => string
 * - Debe ser síncrono y puro (corre en server y client).
 * - width es uno de los anchos del srcset (deviceSizes/imageSizes).
 *
 * @param {{ src: string, width: number, quality?: number }} params
 * @returns {string} URL final que usará <Image>
 */
export default function cloudinaryLoader({ src, width, quality }) {
  // Imágenes que NO son de Cloudinary (logos /assets, placeholders /public):
  // se devuelven tal cual, sin optimizar. Son webp chicos, no hace falta.
  if (!src || !src.includes("res.cloudinary.com") || !src.includes("/image/upload/")) {
    return src;
  }

  const transforms = [
    "f_auto",                  // AVIF/WebP según el header Accept del browser
    `q_${quality || "auto"}`,  // respeta quality del <Image>; si no hay, q_auto
    "c_limit",                 // NUNCA agrandar más allá del original
    `w_${width}`,              // ancho que pide el srcset de Next
  ].join(",");

  // Inserta las transformaciones justo después de /image/upload/.
  // Funciona con o sin segmento de versión (…/upload/v123/… o …/upload/foo.webp).
  return src.replace("/image/upload/", `/image/upload/${transforms}/`);
}
