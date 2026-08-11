/**
 * Serialización segura de JSON-LD para inyectar en un <script>.
 *
 * EL PROBLEMA
 * JSON.stringify NO escapa "<" ni ">". Si un dato que viene del backend
 * contiene la secuencia de cierre de script, corta la etiqueta antes de tiempo
 * y todo lo que siga se ejecuta como HTML. En este sitio los datos de los
 * vehículos (marca, modelo, versión) van al JSON-LD, así que un valor cargado
 * con esa secuencia se convertiría en ejecución de código en el dominio —y con
 * la sesión del admin guardada en localStorage, en robo de sesión.
 *
 * LA SOLUCIÓN
 * Escapar los caracteres peligrosos como secuencias unicode. Dentro de un
 * string JSON, "<" y su escape son exactamente el mismo carácter para
 * cualquier parser, así que Google lee el structured data igual. Lo único que
 * cambia es que el navegador ya no ve una etiqueta.
 *
 * También se escapan los separadores de línea U+2028 y U+2029: son válidos
 * dentro de JSON pero rompen el parseo de JavaScript. Acá se los escribe como
 * secuencias de escape y no como caracteres literales justamente por eso:
 * puestos literalmente rompen este mismo archivo (pasó al escribirlo).
 *
 * @author Indiana Peugeot
 */

const PELIGROSOS = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const RE_PELIGROSOS = /[<>&\u2028\u2029]/g;

/**
 * Convierte un objeto en el string listo para dangerouslySetInnerHTML.
 *
 * @param {any} data - Objeto JSON-LD
 * @returns {string|null} String escapado, o null si no se pudo serializar
 */
export function serializeJsonLd(data) {
  if (data == null) return null;

  let json;
  try {
    json = JSON.stringify(data);
  } catch {
    // Referencias circulares o valores no serializables: mejor omitir el
    // structured data que romper la página.
    return null;
  }

  if (typeof json !== "string") return null;

  return json.replace(RE_PELIGROSOS, (c) => PELIGROSOS[c]);
}

export default serializeJsonLd;
