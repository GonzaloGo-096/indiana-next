/**
 * Reglas del archivo del CV, compartidas por el formulario y /api/careers.
 *
 * Son un espejo de las del backend (POST /jobs/apply, middlewars/
 * jobApplicationUpload.js, verificado el 2026-09-24): acá sirven para avisar
 * rápido y no mandarle al backend algo que igual va a rechazar. Quien decide
 * es el backend, que además revisa el CONTENIDO real del archivo (que un
 * .pdf sea de verdad un PDF): eso no se repite acá, para no tener dos copias
 * de la misma regla.
 *
 * - Tipos: PDF y Word (.docx). La extensión y el tipo que informa el navegador
 *   tienen que coincidir, igual que en el backend.
 * - Tamaño: 4 MB, el tope del backend. Además Vercel corta cualquier pedido de
 *   más de 4,5 MB con un 413 antes de llegar a la API (incluye los campos del
 *   formulario), así que no conviene subirlo.
 *
 * @author Indiana Peugeot
 */

export const MAX_CV_BYTES = 4 * 1024 * 1024;
export const MAX_CV_LABEL = "4 MB";

/** Extensión → tipo que tiene que informar el navegador. */
const TIPOS_POR_EXTENSION = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Para el atributo `accept` del input de archivo. */
export const CV_ACCEPT = [...Object.keys(TIPOS_POR_EXTENSION), ...Object.values(TIPOS_POR_EXTENSION)].join(",");

export const CV_TIPOS_LABEL = "PDF o Word (.docx)";

/**
 * @param {{ name?: string, type?: string }} archivo
 * @returns {boolean} si es un PDF o un .docx con el tipo que corresponde
 */
export function esCvAceptado(archivo) {
  const nombre = String(archivo?.name ?? "").toLowerCase();
  const punto = nombre.lastIndexOf(".");
  const extension = punto >= 0 ? nombre.slice(punto) : "";
  const esperado = TIPOS_POR_EXTENSION[extension];
  return Boolean(esperado) && archivo?.type === esperado;
}
