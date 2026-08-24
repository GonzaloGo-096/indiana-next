/**
 * Datos de contacto de Indiana: sedes, teléfonos, redes y direcciones.
 *
 * Fuente única. Antes esto vivía adentro del footer y el número de WhatsApp
 * estaba escrito literal en ocho archivos distintos, así que cambiar una línea
 * telefónica obligaba a acordarse de los ocho.
 *
 * Sobre el teléfono: `texto` y `e164` se declaran los dos, no se deriva uno del
 * otro. Derivarlo fue justamente lo que produjo tel:+540381..., con el 0 del
 * prefijo nacional metido adentro de un número internacional. Son dos formatos
 * del mismo teléfono y cada uno tiene su trabajo: `texto` es el que se lee,
 * `e164` es el que se marca.
 */

/**
 * @typedef {object} Sede
 * @property {string} id            Identifica la sede en los eventos de analytics.
 * @property {string} nombre        Cómo se la nombra en pantalla.
 * @property {{phone: string, mensaje: string}} whatsapp
 * @property {{texto: string, e164: string}} telefono
 * @property {string} instagram     Usuario, sin arroba.
 * @property {string} direccion     Como se busca en Google Maps.
 */

/**
 * @typedef {object} AreaDeContacto
 * @property {string} id
 * @property {string} titulo
 * @property {Sede[]} sedes
 */

/** Línea comercial de Indiana. Hoy es la misma para las cuatro sedes. */
const WHATSAPP_COMERCIAL = "543816295959";

/** @type {Record<string, Sede>} */
export const SEDES = {
  peugeotSanMiguel: {
    id: "peugeot-san-miguel",
    nombre: "Sede San Miguel de Tucumán",
    whatsapp: {
      phone: WHATSAPP_COMERCIAL,
      mensaje: "Hola, estoy interesado en vehículos 0KM - Sede San Miguel",
    },
    telefono: { texto: "(0381) 421-2000", e164: "+543814212000" },
    instagram: "peugeotindiana",
    direccion: "Salta 160, San Miguel de Tucumán",
  },

  peugeotYerbaBuena: {
    id: "peugeot-yerbabuena",
    nombre: "Sede Yerba Buena - Tucumán",
    whatsapp: {
      phone: WHATSAPP_COMERCIAL,
      mensaje: "Hola, estoy interesado en vehículos 0KM - Sede Yerba Buena",
    },
    telefono: { texto: "(0381) 421-2000", e164: "+543814212000" },
    instagram: "peugeotindiana",
    direccion: "Av. Aconquija y Bascary, Yerba Buena",
  },

  // El id dice "multimarca-usados" y no "usados" porque es el que viaja en los
  // eventos de GA4 desde que existe el footer. Cambiarlo corta la serie.
  usados: {
    id: "multimarca-usados",
    nombre: "Multimarca | Usados",
    whatsapp: {
      phone: WHATSAPP_COMERCIAL,
      mensaje: "Hola, estoy interesado en autos usados",
    },
    telefono: { texto: "(0381) 231-3107", e164: "+543812313107" },
    instagram: "usadosindiana",
    direccion: "Santa Fe 2145, San Miguel de Tucumán",
  },

  posventa: {
    id: "posventa-taller",
    nombre: "Posventa / Taller",
    whatsapp: {
      phone: WHATSAPP_COMERCIAL,
      mensaje: "Hola, quiero información sobre servicios de postventa",
    },
    telefono: { texto: "(0381) 434-7700", e164: "+543814347700" },
    instagram: "peugeotindiana",
    direccion: "Italia 2945, San Miguel de Tucumán",
  },
};

/**
 * Cómo se agrupan las sedes cuando se las muestra juntas.
 *
 * Todas las áreas tienen `sedes`, aunque sea una sola: una sola forma de dato
 * es lo que evita que cada consumidor tenga que preguntar de qué forma vino.
 * Cuántas sedes hay sí cambia cómo se muestran, pero eso es una cuenta, no una
 * estructura distinta.
 *
 * @type {AreaDeContacto[]}
 */
export const AREAS_DE_CONTACTO = [
  {
    id: "peugeot-oficial",
    titulo: "Peugeot oficial | 0 km",
    sedes: [SEDES.peugeotSanMiguel, SEDES.peugeotYerbaBuena],
  },
  {
    id: "multimarca-usados",
    titulo: "Multimarca | Usados",
    sedes: [SEDES.usados],
  },
  {
    id: "posventa-taller",
    titulo: "Posventa / Taller",
    sedes: [SEDES.posventa],
  },
];
