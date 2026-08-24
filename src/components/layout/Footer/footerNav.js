/**
 * Las dos columnas de enlaces internos del footer.
 *
 * Son navegación del sitio, no datos de contacto: por eso viven acá y no en
 * `config/contacto`.
 *
 * Los textos van en minúscula a propósito. La hoja de estilos les aplica
 * `text-transform: capitalize`, así que "Usados | multimarca" se lee
 * "Usados | Multimarca". Escribirlos ya capitalizados no cambiaría nada hoy,
 * pero deja el dato mintiendo sobre lo que se ve.
 */

/**
 * @typedef {object} ColumnaDeEnlaces
 * @property {string} id
 * @property {string} titulo
 * @property {{texto: string, href: string}[]} enlaces
 */

/** @type {ColumnaDeEnlaces[]} */
export const NAVEGACION_FOOTER = [
  {
    id: "sitio",
    titulo: "Sitio",
    enlaces: [
      { texto: "Peugeot | 0km", href: "/0km" },
      { texto: "Planes", href: "/planes" },
      { texto: "Usados | multimarca", href: "/usados" },
      { texto: "Postventa", href: "/postventa" },
      { texto: "Trabaja con nosotros", href: "/trabaja-con-nosotros" },
    ],
  },
  {
    id: "vehiculos",
    titulo: "Vehículos",
    enlaces: [
      { texto: "Usados", href: "/usados/vehiculos" },
      { texto: "Peugeot | 0km", href: "/0km" },
    ],
  },
];
