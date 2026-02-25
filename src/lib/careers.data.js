/**
 * careers.data.js - Datos estáticos de búsquedas activas
 *
 * Centraliza el copy de las posiciones abiertas para mantener
 * el JSX limpio y facilitar actualizaciones.
 *
 * @author Indiana Peugeot
 */

export const activeSearches = [
  {
    id: "vendedor-autos",
    title: "Vendedor/a de Autos",
    buscamos: {
      title: "Buscamos",
      bullets: [
        "Personas con experiencia en ventas o con orientación comercial",
        "Capacidad de trabajo en equipo y comunicación efectiva",
        "Compromiso con la atención al cliente",
      ],
    },
    valoramos: {
      title: "Valoramos",
      bullets: [
        "Orientación al cliente y resultados",
        "Conocimiento del mercado automotor (deseable)",
        "Proactividad e iniciativa",
      ],
    },
    nuestraPropuesta: {
      title: "Nuestra propuesta",
      bullets: [
        "Capacitación continua en productos Peugeot",
        "Ambiente de trabajo profesional",
        "Remuneración acorde al puesto",
      ],
    },
  },
  {
    id: "asesor-postventa",
    title: "Asesor/a de Postventa",
    buscamos: {
      title: "Buscamos",
      bullets: [
        "Personas con experiencia en atención al cliente o servicio",
        "Organización y seguimiento de turnos",
        "Buena comunicación oral y escrita",
      ],
    },
    valoramos: {
      title: "Valoramos",
      bullets: [
        "Empatía y trato cordial",
        "Conocimientos básicos de autos (deseable)",
        "Compromiso con la calidad del servicio",
      ],
    },
    nuestraPropuesta: {
      title: "Nuestra propuesta",
      bullets: [
        "Capacitación en procesos de postventa",
        "Integración a un equipo consolidado",
        "Estabilidad y crecimiento laboral",
      ],
    },
  },
];

/** Puestos disponibles para el select del formulario */
export const jobPositions = activeSearches.map((job) => ({
  value: job.id,
  label: job.title,
}));
