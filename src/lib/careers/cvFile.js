/**
 * Reglas del archivo del CV, compartidas por el formulario y /api/careers.
 *
 * - Tamaño: Vercel corta cualquier pedido de más de 4,5 MB con un 413 antes de
 *   llegar a la API, y ese límite incluye los campos del formulario. Con 4 MB
 *   para el archivo queda margen para el resto.
 * - Tipo: el MIME que manda el navegador sale de la extensión y se puede
 *   falsificar; lo que vale es el contenido. La API mira los primeros bytes.
 *
 * @author Indiana Peugeot
 */

export const MAX_CV_BYTES = 4 * 1024 * 1024;
export const MAX_CV_LABEL = "4 MB";
export const ACCEPTED_CV_TYPES = ["application/pdf", "image/jpeg", "image/jpg"];

const FIRMAS = [
  { tipo: "pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }, // "%PDF-"
  { tipo: "jpg", bytes: [0xff, 0xd8, 0xff] },
];

/**
 * Tipo real del archivo según sus primeros bytes: "pdf", "jpg" o null.
 * @param {Uint8Array} inicio
 */
export function detectCvType(inicio) {
  const firma = FIRMAS.find(({ bytes }) => bytes.every((b, i) => inicio[i] === b));
  return firma ? firma.tipo : null;
}
