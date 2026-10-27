/**
 * planes.js - Planes de financiación disponibles
 * 
 * Contiene todos los planes de financiación con sus características,
 * modelos aplicables y condiciones.
 * 
 * Estructura preparada para migración futura a backend.
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

/**
 * Mapeo de nombres de modelos en planes a slugs del sistema
 * 
 * Los nombres en los planes pueden variar, este mapeo permite
 * identificar correctamente a qué modelo del sistema corresponde cada plan.
 * 
 * También mapea los nombres de modelos que vienen del auto (pueden ser
 * "2008", "208", "Expert", "Partner" en diferentes casos).
 */
const MODELO_MAP = {
  // 2008 - Variaciones del nombre en planes
  '2008': ['2008'],
  'nuevo 2008': ['2008'],
  'nuevo 2008 allure t200 am26': ['2008'],
  '2008 allure t200 am26': ['2008'],
  'nuevo 2008 active t200 am24': ['2008'],
  '2008 active t200 am26': ['2008'],
  'peugeot 2008 active t200': ['2008'],
  
  // 208 - Variaciones del nombre en planes
  '208': ['208'],
  'nuevo 208': ['208'],
  'nuevo 208 allure': ['208'],
  '208 allure mt': ['208'],
  '208 allure mt am26': ['208'],
  'nuevo 208 allure at': ['208'],
  '208 allure at am26': ['208'],
  'peugeot 208 allure': ['208'],
  'peugeot 208 allure at': ['208'],
  
  // Expert - Variaciones del nombre en planes
  'expert': ['expert'],
  'expert l3 hdi 120 - carga': ['expert'],
  'expert l3 hdi 120 - mixto': ['expert'],
  'expert l3 hdi 150 am26': ['expert'],
  
  // Partner - Variaciones del nombre en planes
  'partner': ['partner'],
  'partner confort 1.6 hdi 92': ['partner'],
  'partner confort 1.6 hdi 92 am25': ['partner'],
  'partner confort 1.6': ['partner'],
}

/**
 * Normalizar nombre de modelo para matching
 * @param {string} nombre - Nombre del modelo en el plan
 * @returns {string} - Nombre normalizado
 */
const normalizarNombre = (nombre) => {
  return nombre.toLowerCase().trim()
}

/**
 * Obtener slugs de modelos aplicables a partir de un nombre
 * @param {string} nombreModelo - Nombre del modelo en el plan
 * @returns {string[]} - Array de slugs de modelos
 */
const getModelosSlugs = (nombreModelo) => {
  const normalizado = normalizarNombre(nombreModelo)
  
  // Buscar coincidencia exacta
  if (MODELO_MAP[normalizado]) {
    return MODELO_MAP[normalizado]
  }
  
  // Buscar coincidencia parcial
  for (const [key, slugs] of Object.entries(MODELO_MAP)) {
    if (normalizado.includes(key) || key.includes(normalizado)) {
      return slugs
    }
  }
  
  // Si no hay coincidencia, intentar extraer número de modelo
  const match = normalizado.match(/(\d{3,4})/)
  if (match) {
    const numero = match[1]
    if (numero === '2008' || numero === '208') {
      return [numero]
    }
  }
  
  return []
}

/**
 * Normalizar modelo del auto para matching
 * @param {string} modelo - Modelo del auto (puede venir como "2008", "208", "Expert", "Partner", etc.)
 * @returns {string} - Modelo normalizado (lowercase)
 */
const normalizarModeloAuto = (modelo) => {
  if (!modelo) return ''
  return modelo.toLowerCase().trim()
}

/**
 * Verificar si un plan aplica a un modelo específico
 * @param {Object} plan - Objeto plan
 * @param {string} modeloAuto - Modelo del auto (ej: '2008', '208', 'Expert', 'Partner')
 * @returns {boolean}
 */
const planAplicaAModelo = (plan, modeloAuto) => {
  if (!plan || !plan.modelos || !Array.isArray(plan.modelos) || !modeloAuto) {
    return false
  }
  
  const modeloNormalizado = normalizarModeloAuto(modeloAuto)
  
  // Verificar si el modelo del auto coincide directamente con algún slug
  return plan.modelos.some(nombreModelo => {
    const slugs = getModelosSlugs(nombreModelo)
    return slugs.some(slug => slug.toLowerCase() === modeloNormalizado)
  })
}

/**
 * Array de todos los planes disponibles
 * 
 * Cada plan contiene:
 * - id: Identificador único (es la URL /planes/[id], no cambiarlo)
 * - id_oficial: id del plan en peugeotplan.com.ar (lo usa scripts/planes-oficiales.mjs)
 * - plan: Nombre del plan
 * - modelos: Array de nombres de modelos a los que aplica
 * - cuotas_desde: Valor de cuota inicial
 * - valor_movil_con_imp: Valor del vehículo con impuestos
 * - valor_movil_sin_imp: Valor del vehículo sin impuestos
 * - caracteristicas: Objeto con todas las características del plan
 */
export const PLANES = [
  {
    id: "easy",
    id_oficial: 77,
    plan: "Easy",
    modelos: ["208 Allure MT"],
    cuotas_desde: 189420,
    valor_movil_con_imp: 41670000,
    valor_movil_sin_imp: 34438017,
    caracteristicas: {
      cuotas_totales: 120,
      tipo_plan: "70/30",
      adjudicacion_pactada: [12],
      licitacion_minima: { "12": "20%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" },
    },
  },
  {
    id: "plus-208",
    id_oficial: 82,
    plan: "208 Allure",
    modelos: ["208 Allure MT AM26.5"],
    cuotas_desde: 368473,
    valor_movil_con_imp: 41670000,
    valor_movil_sin_imp: 34438017,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "80/20",
      adjudicacion_pactada: [2, 6, 9, 12],
      licitacion_minima: {
        "2": "20%",
        "6": "20%",
        "9": "20%",
        "12": "20%",
      },
      derecho_inscripcion_prorrateado: 18,
      sellado_prorrateado: 12,
      diferimiento_comercial: {
        "cuotas_1_12": "20%",
        "cuotas_13_18": "10%",
      },
      recupero_diferimiento: { "cuotas_25_72": "6.3%" },
    },
  },
  {
    id: "plus-at",
    id_oficial: 422,
    plan: "Plus AT",
    modelos: ["208 Allure AT AM26.5"],
    cuotas_desde: 484246,
    valor_movil_con_imp: 43810000,
    valor_movil_sin_imp: 36206612,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "100%",
      adjudicacion_pactada: [2],
      licitacion_minima: { "2": "10%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: {
        "cuotas_1_12": "20%",
        "cuotas_13_13": "10%",
      },
      recupero_diferimiento: { "cuotas_25_72": "6.3%" },
    },
  },
  {
    id: "2008-active-t200",
    id_oficial: 2327,
    plan: "2008 Like T200",
    modelos: ["2008 Like T200 AM27"],
    cuotas_desde: 425330,
    valor_movil_con_imp: 48120000,
    valor_movil_sin_imp: 39768595,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "80/20",
      adjudicacion_pactada: [2, 6, 9, 12],
      licitacion_minima: {
        "2": "20%",
        "6": "20%",
        "9": "20%",
        "12": "20%",
      },
      derecho_inscripcion_prorrateado: 18,
      sellado_prorrateado: 12,
      diferimiento_comercial: {
        "cuotas_1_12": "20%",
        "cuotas_13_18": "10%",
      },
      recupero_diferimiento: { "cuotas_25_72": "6.3%" },
    },
  },
  {
    id: "partner-hdi",
    id_oficial: 5311,
    plan: "Partner HDI",
    modelos: ["Partner Van L2 HDI 92 AM26"],
    cuotas_desde: 369515,
    valor_movil_con_imp: 43080000,
    valor_movil_sin_imp: 38986425,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [4, 6, 9],
      licitacion_minima: {
        "4": "30%",
        "6": "30%",
        "9": "30%",
      },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" },
    },
  },
  {
    id: "expert-carga",
    id_oficial: 5310,
    plan: "Expert",
    modelos: ["Expert L3 HDI 150 AM26"],
    cuotas_desde: 510914,
    valor_movil_con_imp: 59590000,
    valor_movil_sin_imp: 53927602,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [4, 6, 9, 12],
      licitacion_minima: {
        "4": "30%",
        "6": "30%",
        "9": "30%",
        "12": "30%",
      },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" },
    },
  },
  {
    id: "2008-t200",
    id_oficial: 5309,
    plan: "2008 T200",
    modelos: ["2008 Allure T200 AM27"],
    cuotas_desde: 579282,
    valor_movil_con_imp: 52430000,
    valor_movil_sin_imp: 43330579,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "100%",
      adjudicacion_pactada: [2],
      licitacion_minima: { "2": "10%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: {
        "cuotas_1_12": "20%",
        "cuotas_13_18": "10%",
      },
      recupero_diferimiento: { "cuotas_25_72": "6.3%" },
    },
  },
]

/**
 * Obtener planes aplicables a un modelo específico
 * @param {string} modeloAuto - Modelo del auto (ej: '2008', '208', 'Expert', 'Partner')
 * @returns {Array} - Array de planes que aplican al modelo
 */
export const getPlanesPorModelo = (modeloAuto) => {
  if (!modeloAuto) return []
  
  return PLANES.filter(plan => planAplicaAModelo(plan, modeloAuto))
}

/**
 * Obtener plan por ID
 * @param {string} planId - ID del plan
 * @returns {Object|null} - Plan o null si no existe
 */
export const getPlanPorId = (planId) => {
  return PLANES.find(p => p.id === planId) || null
}

/**
 * Obtener todos los planes
 * @returns {Array} - Array de todos los planes
 */
export const getAllPlanes = () => {
  return PLANES
}

/**
 * Extraer modelo base del nombre del modelo
 * @param {string} nombreModelo - Nombre completo del modelo
 * @returns {string} - Modelo base (2008, 208, expert, partner)
 */
export const extraerModeloBase = (nombreModelo) => {
  const nombre = nombreModelo.toLowerCase();

  // Orden: números más largos primero para no confundir 408 con 208, 2008 con 008, etc.
  if (/\b5008\b/.test(nombre)) return "5008";
  if (/\b3008\b/.test(nombre)) return "3008";
  if (/\b2008\b/.test(nombre)) return "2008";
  if (/\b408\b/.test(nombre)) return "408";
  if (/\b208\b/.test(nombre)) return "208";
  if (nombre.includes("expert")) return "expert";
  if (nombre.includes("partner")) return "partner";
  if (nombre.includes("boxer")) return "boxer";

  return "otros";
};

export default PLANES

