import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPlanes, getPlanPorId } from "../../../data/planes";
import { getModelo } from "../../../data/modelos";
import { absoluteUrl } from "../../../lib/site-url";
import { formatPrice } from "../../../utils/formatters";
import styles from "./plan-detalle.module.css";

/**
 * Función para obtener versión del plan basándose en el nombre del plan y los modelos
 * @param {Object} plan - Objeto del plan
 * @returns {string} - Nombre de la versión
 */
function obtenerVersionDelPlan(plan) {
  // Extraer modelo base del primer modelo del plan
  const primerModelo = plan.modelos?.[0]?.toLowerCase() || "";
  let modeloSlug = "";
  
  if (primerModelo.includes("2008")) modeloSlug = "2008";
  else if (primerModelo.includes("208")) modeloSlug = "208";
  else if (primerModelo.includes("expert")) modeloSlug = "expert";
  else if (primerModelo.includes("partner")) modeloSlug = "partner";
  
  const modeloData = getModelo(modeloSlug);
  if (!modeloData || !modeloData.versiones) return "";

  const nombrePlan = plan.plan.toLowerCase();
  const modelosPlan = plan.modelos.map((m) => m.toLowerCase());

  // Mapeo específico por plan
  const mapeoVersiones = {
    "2008-allure-t200": "ALLURE",
    "2008-active-t200": "ACTIVE",
    easy: "ALLURE",
    "plus-at": "ALLURE AT",
    "plus-208": "ALLURE",
    "expert-carga": "L3 HDI 120 - Carga",
    "partner-hdi": "CONFORT 1.6 HDI 92",
  };

  // Buscar por ID del plan
  if (mapeoVersiones[plan.id]) {
    return mapeoVersiones[plan.id];
  }

  // Buscar versión en los nombres de modelos del plan
  for (const nombreModelo of modelosPlan) {
    for (const version of modeloData.versiones) {
      const versionNombre = version.nombre.toLowerCase();
      const versionNombreCorto = version.nombreCorto.toLowerCase();

      if (
        nombreModelo.includes(versionNombre) ||
        nombreModelo.includes(versionNombreCorto)
      ) {
        return version.nombreCorto || version.nombre;
      }
    }
  }

  return "";
}

/**
 * Generar rutas estáticas para todos los planes
 */
export async function generateStaticParams() {
  try {
    const planes = getAllPlanes();

    if (!Array.isArray(planes) || planes.length === 0) {
      console.warn("No se encontraron planes para generar rutas estáticas");
      return [];
    }

    return planes.map((plan) => ({
      planId: plan.id,
    }));
  } catch (error) {
    console.error("Error generating static params for plans:", error);
    return [];
  }
}

/**
 * Generar metadata dinámica para cada plan
 */
export async function generateMetadata({ params }) {
  try {
    const { planId } = await params;
    const plan = getPlanPorId(planId);

    if (!plan) {
      return {
        title: "Plan no encontrado | Indiana Peugeot",
        description: "El plan solicitado no está disponible.",
      };
    }

    const canonicalUrl = absoluteUrl(`/planes/${planId}`);
    const title = `Plan ${plan.plan} - Peugeot 0km | Indiana Peugeot`;
    const description = `Detalles del plan de financiación ${plan.plan} para Peugeot 0km. Cuota desde ${formatPrice(plan.cuotas_desde)}.`;
    const keywords = `plan ${plan.plan}, financiación Peugeot, cuotas Peugeot, ${plan.plan} 0km, planes de ahorro Peugeot Tucumán`;

    return {
      title,
      description,
      keywords: keywords,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: [
          {
            url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"),
            alt: `Plan ${plan.plan} - Indiana Peugeot`,
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp")],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata for plan:", error);
    return {
      title: "Error | Indiana Peugeot",
      description: "Error al cargar la información del plan.",
    };
  }
}

/**
 * Página de detalle de plan de financiación
 * Mismo diseño visual que PlanCard pero adaptado al viewport completo
 * SSG: Se genera estáticamente en build time para cada plan
 */
export default async function PlanDetallePage({ params }) {
  const { planId } = await params;
  const plan = getPlanPorId(planId);

  if (!plan) {
    notFound();
  }

  const {
    plan: nombrePlan,
    cuotas_desde,
    valor_movil_con_imp,
    valor_movil_sin_imp,
    caracteristicas,
  } = plan;

  const version = obtenerVersionDelPlan(plan);
  const cuotasTotales = caracteristicas?.cuotas_totales || null;

  // Determinar modelo para mostrar en el título si aplica
  const primerModelo = plan.modelos?.[0]?.toLowerCase() || "";
  const mostrarModeloEnVersion = primerModelo.includes("208");
  const modeloDisplay = mostrarModeloEnVersion 
    ? primerModelo.charAt(0).toUpperCase() + primerModelo.slice(1).split(" ")[0]
    : "";

  return (
    <div className={styles.container}>
      {/* Link de vuelta */}
      <Link href="/planes" className={styles.backLink}>
        ← Volver a planes
      </Link>

      {/* Card expandida - Mismo diseño visual que PlanCard pero adaptado al viewport */}
      <div className={styles.planCard}>
        {/* Header del plan - Alineado a la izquierda */}
        <div className={styles.planHeader}>
          <h1 className={styles.planTitle}>
            Plan {nombrePlan}
            {version && (
              <>
                {" - "}
                {mostrarModeloEnVersion && modeloDisplay}
                {mostrarModeloEnVersion && version && (
                  <span className={styles.versionSeparator}> {version}</span>
                )}
                {!mostrarModeloEnVersion && version}
              </>
            )}
          </h1>
        </div>

        {/* Información principal - Misma estructura que la card */}
        <div className={styles.planContent}>
          {/* Cuota desde - Grande, azul, con cuotas al lado */}
          <div className={styles.cuotaDesdeContainer}>
            <div className={styles.cuotaDesdeRow}>
              <div className={styles.cuotaDesdeItem}>
                <span className={styles.cuotaDesdeLabel}>Valor cuota</span>
                <span className={styles.cuotaDesdeValue}>
                  {formatPrice(cuotas_desde)}
                </span>
              </div>
              {cuotasTotales && (
                <div className={styles.cuotasTotalesItem}>
                  <span className={styles.cuotasTotalesLabelKey}>Cantidad</span>
                  <div className={styles.cuotasTotalesContainer}>
                    <span className={styles.cuotasTotalesNumber}>
                      {cuotasTotales}
                    </span>
                    <span className={styles.cuotasTotalesLabel}>cuotas</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Características - Fila 1: Valor móvil, Fila 2: Tipo de plan y Adjudicación */}
          <div className={styles.infoBottomRow}>
            {/* Fila 1: Valor móvil con y sin impuestos */}
            <div className={styles.infoBottomRowItem}>
              <div className={styles.infoBottomItem}>
                <span className={styles.infoBottomLabel}>Valor móvil + imp.</span>
                <span className={styles.infoBottomValue}>
                  {formatPrice(valor_movil_con_imp)}
                </span>
              </div>
              {valor_movil_sin_imp && (
                <div className={styles.infoBottomItem}>
                  <span className={styles.infoBottomLabel}>Valor móvil</span>
                  <span className={styles.infoBottomValue}>
                    {formatPrice(valor_movil_sin_imp)}
                  </span>
                </div>
              )}
            </div>

            {/* Fila 2: Tipo de plan y Adjudicación pactada */}
            <div className={styles.infoBottomRowItem}>
              {caracteristicas?.tipo_plan && (
                <div className={styles.infoBottomItem}>
                  <span className={styles.infoBottomLabel}>Tipo de plan</span>
                  <span className={styles.infoBottomValue}>
                    {caracteristicas.tipo_plan}
                  </span>
                </div>
              )}

              {caracteristicas?.adjudicacion_pactada &&
                caracteristicas.adjudicacion_pactada.length > 0 && (
                  <div className={styles.infoBottomItem}>
                    <span className={styles.infoBottomLabel}>
                      Adjudicación pactada
                    </span>
                    <span className={styles.infoBottomValue}>
                      Cuota {caracteristicas.adjudicacion_pactada.join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* Información adicional del plan - Manteniendo la misma estética */}
          {caracteristicas && (
            <>
              {/* Licitación mínima */}
              {caracteristicas.licitacion_minima && (
                <div className={styles.additionalSection}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Licitación mínima
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    {Object.entries(caracteristicas.licitacion_minima).map(
                      ([cuota, porcentaje]) => (
                        <div key={cuota} className={styles.additionalItem}>
                          <span className={styles.additionalItemLabel}>
                            Cuota {cuota}
                          </span>
                          <span className={styles.additionalItemValue}>
                            {porcentaje}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Derecho inscripción y Sellado prorrateado */}
              {(caracteristicas.derecho_inscripcion_prorrateado ||
                caracteristicas.sellado_prorrateado) && (
                <div className={styles.infoBottomRow}>
                  <div className={styles.infoBottomRowItem}>
                    {caracteristicas.derecho_inscripcion_prorrateado && (
                      <div className={styles.infoBottomItem}>
                        <span className={styles.infoBottomLabel}>
                          Derecho inscripción prorrateado
                        </span>
                        <span className={styles.infoBottomValue}>
                          {caracteristicas.derecho_inscripcion_prorrateado} cuotas
                        </span>
                      </div>
                    )}
                    {caracteristicas.sellado_prorrateado && (
                      <div className={styles.infoBottomItem}>
                        <span className={styles.infoBottomLabel}>
                          Sellado prorrateado
                        </span>
                        <span className={styles.infoBottomValue}>
                          {caracteristicas.sellado_prorrateado} cuotas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diferimiento comercial */}
              {caracteristicas.diferimiento_comercial && (
                <div className={styles.additionalSection}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Diferimiento comercial
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    {Object.entries(caracteristicas.diferimiento_comercial).map(
                      ([rango, porcentaje]) => (
                        <div key={rango} className={styles.additionalItem}>
                          <span className={styles.additionalItemLabel}>
                            {rango.replace(/_/g, " ")}
                          </span>
                          <span className={styles.additionalItemValue}>
                            {porcentaje}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Recupero diferimiento */}
              {caracteristicas.recupero_diferimiento && (
                <div className={styles.additionalSection}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Recupero diferimiento
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    {Object.entries(caracteristicas.recupero_diferimiento).map(
                      ([rango, porcentaje]) => (
                        <div key={rango} className={styles.additionalItem}>
                          <span className={styles.additionalItemLabel}>
                            {rango.replace(/_/g, " ")}
                          </span>
                          <span className={styles.additionalItemValue}>
                            {porcentaje}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modelos aplicables */}
          {plan.modelos && plan.modelos.length > 0 && (
            <div className={styles.modelosSection}>
              <div className={styles.modelosSectionHeader}>
                <span className={styles.modelosSectionLabel}>
                  Modelos aplicables
                </span>
              </div>
              <div className={styles.modelosList}>
                {plan.modelos.map((modelo, index) => (
                  <div key={index} className={styles.modeloItem}>
                    {modelo}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

