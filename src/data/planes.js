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
  'nuevo 2008 active t200 am24': ['2008'],
  'peugeot 2008 active t200': ['2008'],
  
  // 208 - Variaciones del nombre en planes
  '208': ['208'],
  'nuevo 208': ['208'],
  'nuevo 208 allure': ['208'],
  'nuevo 208 allure at': ['208'],
  'peugeot 208 allure': ['208'],
  'peugeot 208 allure at': ['208'],
  
  // Expert - Variaciones del nombre en planes
  'expert': ['expert'],
  'expert l3 hdi 120 - carga': ['expert'],
  'expert l3 hdi 120 - mixto': ['expert'],
  
  // Partner - Variaciones del nombre en planes
  'partner': ['partner'],
  'partner confort 1.6 hdi 92': ['partner'],
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
 * - id: Identificador único
 * - plan: Nombre del plan
 * - modelos: Array de nombres de modelos a los que aplica
 * - cuotas_desde: Valor de cuota inicial
 * - valor_movil_con_imp: Valor del vehículo con impuestos
 * - valor_movil_sin_imp: Valor del vehículo sin impuestos
 * - caracteristicas: Objeto con todas las características del plan
 */
export const PLANES = [
  {
    id: "2008-allure-t200",
    plan: "2008 ALLURE T200",
    modelos: ["Nuevo 2008 Allure T200 AM26"],
    cuotas_desde: 477782,
    valor_movil_con_imp: 48760000,
    valor_movil_sin_imp: 40297521,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [2, 6, 9],
      licitacion_minima: { "2": "40%", "6": "30%", "9": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" }
    }
  },
  {
    id: "expert-carga",
    plan: "EXPERT",
    modelos: ["EXPERT L3 HDI 120 - Carga"],
    cuotas_desde: 492994,
    valor_movil_con_imp: 57500000,
    valor_movil_sin_imp: 52036199,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [6, 24, 36],
      licitacion_minima: { "6": "30%", "24": "30%", "36": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" }
    }
  },
  {
    id: "easy",
    plan: "EASY",
    modelos: ["NUEVO 208 Allure"],
    cuotas_desde: 238502,
    valor_movil_con_imp: 36180000,
    valor_movil_sin_imp: 29900826,
    caracteristicas: {
      cuotas_totales: 120,
      tipo_plan: "70/30",
      adjudicacion_pactada: [12],
      licitacion_minima: { "12": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12
    }
  },
  {
    id: "partner-hdi",
    plan: "PARTNER HDI",
    modelos: ["Partner Confort 1.6 HDI 92"],
    cuotas_desde: 326542,
    valor_movil_con_imp: 38070000,
    valor_movil_sin_imp: 34452489,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [4, 6, 9, 12],
      licitacion_minima: { "4": "30%", "6": "30%", "9": "30%", "12": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" }
    }
  },
  {
    id: "2008-active-t200",
    plan: "2008 ACTIVE T200",
    modelos: ["Peugeot 2008 Active T200"],
    cuotas_desde: 393421,
    valor_movil_con_imp: 44510000,
    valor_movil_sin_imp: 36785124,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [4, 6, 9, 12],
      licitacion_minima: { "4": "40%", "6": "40%", "9": "30%", "12": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "20%", "cuotas_13_18": "10%" },
      recupero_diferimiento: { "cuotas_25_72": "6.3%" }
    }
  },
  {
    id: "plus-at",
    plan: "PLUS AT",
    modelos: ["Peugeot 208 Allure AT"],
    cuotas_desde: 372995,
    valor_movil_con_imp: 38050000,
    valor_movil_sin_imp: 31446281,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [3, 6, 9, 12],
      licitacion_minima: { "3": "30%", "6": "30%", "9": "30%", "12": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "10%" },
      recupero_diferimiento: { "cuotas_19_42": "5%" }
    }
  },
  {
    id: "plus-208",
    plan: "PLUS 208",
    modelos: ["Peugeot 208 Allure"],
    cuotas_desde: 319927,
    valor_movil_con_imp: 36180000,
    valor_movil_sin_imp: 29900826,
    caracteristicas: {
      cuotas_totales: 84,
      tipo_plan: "70/30",
      adjudicacion_pactada: [3, 6, 9, 12],
      licitacion_minima: { "3": "30%", "6": "30%", "9": "30%", "12": "30%" },
      derecho_inscripcion_prorrateado: 12,
      sellado_prorrateado: 12,
      diferimiento_comercial: { "cuotas_1_12": "20%", "cuotas_13_18": "10%" },
      recupero_diferimiento: { "cuotas_25_72": "6.3%" }
    }
  }
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
  
  if (nombre.includes("2008")) return "2008";
  if (nombre.includes("208")) return "208";
  if (nombre.includes("expert")) return "expert";
  if (nombre.includes("partner")) return "partner";
  
  return "otros";
};

export default PLANES

