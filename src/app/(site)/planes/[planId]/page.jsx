import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPlanes, getPlanPorId, extraerModeloBase } from "../../../../data/planes";
import { getModelo, COLORES } from "../../../../data/modelos";
import { absoluteUrl } from "../../../../lib/site-url";
import { formatPrice } from "../../../../utils/formatters";
import { PlanImageDesktop } from "./PlanImageDesktop";
import cta from "@/components/home/HomeSectionCtas.module.css";
import contact from "@/components/ui/ContactButtons.module.css";
import WhatsAppLink from "@/components/analytics/WhatsAppLink";
import ItemViewTracker from "@/components/analytics/ItemViewTracker";
import { SOURCES, LOCATIONS, LEAD_TYPES, VERTICALS } from "@/lib/analytics/events";
import { buildItemParamsFromPlan } from "@/lib/analytics/params";
import styles from "./plan-detalle.module.css";

const WHATSAPP_PHONE_PLAN = "543816295959";

/**
 * Disclaimer legal — texto referencial para todos los planes de financiación.
 * Centralizado aquí para modificarlo en un solo lugar.
 */
const PLAN_LEGAL_DISCLAIMER =
  "Los valores de cuotas, precios, impuestos y condiciones publicados son estimativos y de carácter informativo. No constituyen una oferta vinculante. Los importes pueden variar sin previo aviso según listas vigentes, gastos administrativos, impuestos, condiciones comerciales, disponibilidad de unidades y requisitos de aprobación. El precio final, la disponibilidad y las condiciones definitivas serán confirmadas por un asesor comercial al momento de la operación.";

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
    "2008-t200": "ALLURE",
    "2008-active-t200": "ACTIVE",
    easy: "ALLURE",
    "plus-at": "ALLURE AT",
    "plus-208": "ALLURE",
    "expert-carga": "L3 HDI 150",
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
 * Función para obtener modeloSlug del plan
 * @param {Object} plan - Objeto del plan
 * @returns {string} - Slug del modelo (2008, 208, expert, partner)
 */
function obtenerModeloSlug(plan) {
  const primerModelo = plan.modelos?.[0]?.toLowerCase() || "";
  
  if (primerModelo.includes("2008")) return "2008";
  if (primerModelo.includes("208")) return "208";
  if (primerModelo.includes("expert")) return "expert";
  if (primerModelo.includes("partner")) return "partner";
  
  return "";
}

/**
 * Formatea clave de rango (ej. cuotas_1_12 → "cuotas 1 a 12" o "Cts. 1 a 12")
 * @param {string} rango - Clave del rango (ej. cuotas_1_12)
 * @param {boolean} useCts - Si true, usa "Cts." en lugar de "cuotas"
 */
function formatearRangoCuotas(rango, useCts = false) {
  const conEspacios = rango.replace(/_/g, " ");
  const match = conEspacios.match(/^cuotas\s+(\d+)\s+(\d+)$/);
  if (match) {
    return useCts ? `Cts. ${match[1]} a ${match[2]}` : `cuotas ${match[1]} a ${match[2]}`;
  }
  return conEspacios;
}

/** Recupero diferimiento: en datos puede venir "5% de la alícuota" — en pantalla solo el % */
function soloPorcentajeRecupero(valor) {
  if (valor == null || valor === "") return "";
  const s = String(valor).trim();
  const m = s.match(/^[\d]+(?:[.,]\d+)?%/);
  return m ? m[0].replace(",", ".") : s;
}

/**
 * Función para obtener imagen del modelo (primera imagen del carrusel)
 * @param {string} modeloSlug - Slug del modelo
 * @returns {Object|null} - Objeto con { url, alt } o null
 */
function obtenerImagenPorModelo(modeloSlug) {
  const modelo = getModelo(modeloSlug);
  if (!modelo) {
    return null;
  }

  // Si no hay versiones, usar imagenPrincipal como fallback
  if (!modelo.versiones || modelo.versiones.length === 0) {
    if (modelo.imagenPrincipal && modelo.imagenPrincipal.url) {
      return {
        url: modelo.imagenPrincipal.url,
        alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}`,
      };
    }
    return null;
  }

  // Obtener todos los colores disponibles de todas las versiones del modelo
  const coloresDisponibles = new Set();
  modelo.versiones.forEach((version) => {
    if (version.coloresPermitidos) {
      version.coloresPermitidos.forEach((colorKey) => {
        coloresDisponibles.add(colorKey);
      });
    }
  });

  // Convertir a array y obtener objetos color
  const coloresArray = Array.from(coloresDisponibles)
    .map((colorKey) => COLORES[colorKey])
    .filter(Boolean);

  // Si no hay colores, usar imagenPrincipal como fallback
  if (coloresArray.length === 0) {
    if (modelo.imagenPrincipal && modelo.imagenPrincipal.url) {
      return {
        url: modelo.imagenPrincipal.url,
        alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}`,
      };
    }
    return null;
  }

  // Para 208: incluir todos los colores (blanco es el único disponible)
  // Para otros modelos: excluir blanco
  const coloresFiltrados =
    modeloSlug === "208"
      ? coloresArray
      : coloresArray.filter((color) => {
          const key = color.key.toLowerCase();
          return !key.includes("blanco") && !key.includes("white");
        });

  // Si después de filtrar no hay colores, usar todos los disponibles
  const coloresFinales =
    coloresFiltrados.length > 0 ? coloresFiltrados : coloresArray;

  // Usar el primer color (índice 0) como la primera imagen del carrusel
  const colorSeleccionado = coloresFinales[0];

  if (!colorSeleccionado || !colorSeleccionado.url) {
    // Fallback a imagenPrincipal si el color no tiene URL
    if (modelo.imagenPrincipal && modelo.imagenPrincipal.url) {
      return {
        url: modelo.imagenPrincipal.url,
        alt: modelo.imagenPrincipal.alt || `Peugeot ${modelo.nombre}`,
      };
    }
    return null;
  }

  return {
    url: colorSeleccionado.url,
    alt: `Peugeot ${modelo.nombre} ${colorSeleccionado.label}`,
  };
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
        title: "Plan no disponible",
        description: "El plan solicitado no está disponible.",
      };
    }

    const canonicalUrl = absoluteUrl(`/planes/${planId}`);
    const rawModelo = extraerModeloBase(plan.modelos?.[0] || "");
    const modeloDisplay =
      rawModelo && rawModelo !== "otros"
        ? rawModelo.charAt(0).toUpperCase() + rawModelo.slice(1)
        : "";
    const title = modeloDisplay
      ? `Plan Peugeot ${modeloDisplay} – ${plan.plan}`
      : `Plan ${plan.plan} – Peugeot 0km`;
    const description = `Consultá el plan de ahorro Peugeot ${modeloDisplay || plan.plan} disponible en Indiana Tucumán. Cuota desde ${formatPrice(plan.cuotas_desde)}.`;
    const keywords = `plan ${plan.plan}, planes de ahorro Peugeot, financiación Peugeot${modeloDisplay ? `, Peugeot ${modeloDisplay}` : ""}, cuotas Peugeot, planes Peugeot Tucumán`;

    return {
      title,
      description,
      keywords: keywords,
      openGraph: {
        title: `${title} | Peugeot Indiana`,
        description,
        url: canonicalUrl,
        siteName: "Indiana Peugeot",
        locale: "es_AR",
        type: "website",
        images: [
          {
            url: absoluteUrl("/assets/logos/logos-indiana/desktop/azul-chico-desktop.webp"),
            alt: `${title} | Peugeot Indiana`,
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Peugeot Indiana`,
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
      title: "Plan no disponible",
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

  // Obtener modeloSlug e imagen del modelo (para desktop)
  const modeloSlug = obtenerModeloSlug(plan);
  const imagenModelo = modeloSlug ? obtenerImagenPorModelo(modeloSlug) : null;

  return (
    <div
      className={`${styles.container} w-full min-w-0 antialiased`}
    >
      <ItemViewTracker
        item={buildItemParamsFromPlan({
          id: plan.id,
          nombre: plan.plan,
          modelo: plan.modelos?.[0],
          cuota: plan.cuotas_desde,
        })}
        location={LOCATIONS.PLAN_DETAIL}
        source={SOURCES.INLINE}
        componentId="detail_page"
      />
      <div className={`${styles.backRow} w-full`}>
        <Link
          href="/planes"
          className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInline}`}
          aria-label="Volver al listado de planes"
        >
          Atrás
        </Link>
      </div>

      {/* Sección de plan — CSS module (tipografía/cuotas/cubículos) + Tailwind (layout, a11y) */}
      <section
        className={`${styles.planSection} w-full min-w-0`}
        aria-labelledby="plan-detalle-titulo"
      >
        <div className={styles.planHeader}>
          <h1
            id="plan-detalle-titulo"
            className={`${styles.planTitle} text-balance max-w-[42rem] mx-auto`}
          >
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

        {/* Grid principal: imagen izquierda, info derecha (desktop) */}
        <div className={`${styles.planMainGrid} min-w-0`}>
          {/* Columna izquierda: Imagen del auto (solo desktop - Client Component para evitar carga en mobile) */}
          {imagenModelo && (
            <PlanImageDesktop
              imagenModelo={imagenModelo}
              modeloSlug={modeloSlug || undefined}
            />
          )}

          {/* Columna derecha: Información del plan */}
          <div className={styles.planInfoColumn}>
            {/* Prioridad 1: Cuotas + Valor cuota */}
            <div className={styles.planKeyMetrics}>
              <div className={styles.cuotaDesdeContainer}>
                <div className={styles.cuotaDesdeRow}>
                  <div className={styles.cuotaDesdeItem}>
                    <span className={styles.cuotaDesdeLabel}>Cuota estimada*</span>
                    <span className={styles.cuotaDesdeValue}>
                      {formatPrice(cuotas_desde)}
                    </span>
                  </div>
                  {cuotasTotales && (
                    <div className={styles.cuotaDesdeItem}>
                      <span className={styles.cuotaDesdeLabel}>Cantidad de cuotas</span>
                      <span className={styles.cuotaDesdeValue}>
                        {cuotasTotales}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prioridad 2: 4 datos en grid 2×2 */}
            <div className={styles.planSecondaryMetrics}>
              <div className={styles.infoBottomRow}>
            {/* Fila 1: Valor móvil y Valor móvil + imp. */}
            <div className={styles.infoBottomRowItem}>
              {valor_movil_sin_imp && (
                <div className={styles.infoBottomItem}>
                  <span className={styles.infoBottomLabel}>Valor móvil ref.*</span>
                  <span className={styles.infoBottomValue}>
                    {formatPrice(valor_movil_sin_imp)}
                  </span>
                </div>
              )}
              <div className={styles.infoBottomItem}>
                <span className={styles.infoBottomLabel}>Valor móvil + imp. ref.*</span>
                <span className={styles.infoBottomValue}>
                  {formatPrice(valor_movil_con_imp)}
                </span>
              </div>
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
                      Posibilidad de adjudicación
                    </span>
                    <span className={styles.infoBottomValue}>
                      Cuota {caracteristicas.adjudicacion_pactada.join(", ")}
                    </span>
                  </div>
                )}
            </div>
          </div>
            </div>
          </div>
        </div>

        {/* Una sola fila de cubículos: todos los datos distribuidos en el ancho */}
        {caracteristicas && (
          <div
            className={`${styles.planDetailsSection} min-w-0`}
            aria-label="Detalle de condiciones del plan"
          >
              {/* Licitación mínima */}
              {caracteristicas.licitacion_minima && (
                <div className={styles.detailCubicle}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Licitación mínima
                    </span>
                  </div>
                  <div className={`${styles.additionalSectionContent} ${styles.hasMultipleItems}`}>
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

              {/* Derecho inscripción prorrateado */}
              {caracteristicas.derecho_inscripcion_prorrateado && (
                <div className={styles.detailCubicle}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Inscripción prorrateado
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    <div className={styles.additionalItem}>
                      <span className={styles.additionalItemValue}>
                        {caracteristicas.derecho_inscripcion_prorrateado} cuotas
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sellado prorrateado */}
              {caracteristicas.sellado_prorrateado && (
                <div className={styles.detailCubicle}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Sellado prorrateado
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    <div className={styles.additionalItem}>
                      <span className={styles.additionalItemValue}>
                        {caracteristicas.sellado_prorrateado} cuotas
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Diferimiento comercial */}
              {caracteristicas.diferimiento_comercial && (
                <div className={styles.detailCubicle}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Diferimiento comercial
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    {Object.entries(caracteristicas.diferimiento_comercial).map(
                      ([rango, porcentaje]) => (
                        <div key={rango} className={styles.additionalItemRow}>
                          <span className={styles.additionalItemLabel}>
                            {formatearRangoCuotas(rango, true)}
                          </span>
                          <span className={styles.additionalItemSeparator}>|</span>
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
                <div className={styles.detailCubicle}>
                  <div className={styles.additionalSectionHeader}>
                    <span className={styles.additionalSectionLabel}>
                      Recupero diferimiento
                    </span>
                  </div>
                  <div className={styles.additionalSectionContent}>
                    {Object.entries(caracteristicas.recupero_diferimiento).map(
                      ([rango, porcentaje]) => (
                        <div key={rango} className={styles.additionalItemRow}>
                          <span className={styles.additionalItemLabel}>
                            {formatearRangoCuotas(rango, true)}
                          </span>
                          <span className={styles.additionalItemSeparator}>|</span>
                          <span className={styles.additionalItemValue}>
                            {soloPorcentajeRecupero(porcentaje)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </section>

      <div className={styles.disclaimerContactWrapper}>
      <section className={styles.contactSection}>
        <div className={styles.contactInner}>
          <WhatsAppLink
            href={`https://wa.me/${WHATSAPP_PHONE_PLAN}?text=${encodeURIComponent(
              `Hola! Quiero solicitar cotización del Plan ${plan.plan} - financiación Peugeot 0km`
            )}`}
            phone={WHATSAPP_PHONE_PLAN}
            source={SOURCES.INLINE}
            location={LOCATIONS.PLAN_DETAIL}
            componentId="whatsapp-detalle-plan"
            messageTemplateId={plan.id}
            leadType={LEAD_TYPES.PLAN_INQUIRY}
            vertical={VERTICALS.ZERO_KM}
            item={buildItemParamsFromPlan({
              id: plan.id,
              nombre: plan.plan,
              modelo: plan.modelos?.[0],
              cuota: plan.cuotas_desde,
            })}
            className={`${cta.button} ${cta.buttonInline} ${styles.planContactWhatsapp} inline-flex items-center`}
            aria-label="Solicitar cotización por WhatsApp"
          >
            <svg
              className={contact.whatsappIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>Solicitar cotización</span>
          </WhatsAppLink>
          <p className={styles.contactMicrocopy}>
            Confirmá precio actualizado, disponibilidad y condiciones con un asesor.
          </p>
        </div>
      </section>

      {/* Disclaimer legal — visible, sobrio, cerca de los valores */}
      <aside className={styles.legalDisclaimer} aria-label="Información legal">
        <p className={styles.legalDisclaimerText}>
          <span className={styles.legalDisclaimerAsterisk}>*</span>
          {PLAN_LEGAL_DISCLAIMER}
        </p>
      </aside>
      </div>
    </div>
  );
}

