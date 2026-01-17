"use client";

import { memo } from "react";
import Link from "next/link";
import { formatPrice } from "../../utils/formatters";
import { getModelo } from "../../data/modelos";
import styles from "./PlanCard.module.css";

/**
 * Función para obtener versión del plan basándose en el nombre del plan y los modelos
 * @param {Object} plan - Objeto del plan
 * @param {string} modeloSlug - Slug del modelo (2008, 208, expert, partner)
 * @returns {string} - Nombre de la versión
 */
const obtenerVersionDelPlan = (plan, modeloSlug) => {
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
};

/**
 * Componente PlanCard - Card individual para cada plan
 * Optimizado con React.memo para evitar re-renders innecesarios en listas
 */
const PlanCardComponent = ({ plan, modelo }) => {
  const {
    plan: nombrePlan,
    cuotas_desde,
    valor_movil_con_imp,
    valor_movil_sin_imp,
    caracteristicas,
  } = plan;

  const modeloDisplay = modelo.charAt(0).toUpperCase() + modelo.slice(1);
  const modeloLower = modelo.toLowerCase();
  const version = obtenerVersionDelPlan(plan, modelo);
  const cuotasTotales = caracteristicas?.cuotas_totales || null;

  // Solo mostrar modelo en el título si es 208
  const mostrarModeloEnVersion = modeloLower === "208";

  return (
    <div className={styles.planCard}>
      {/* Header del plan - Alineado a la izquierda */}
      <div className={styles.planHeader}>
        <h3 className={styles.planTitle}>
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
        </h3>
      </div>

      {/* Información principal */}
      <div className={styles.planContent}>

        {/* Cuota desde - Grande, azul, cursiva, con cuotas al lado */}
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

        {/* Botones de acción */}
        <div className={styles.planActions}>
          <Link href={`/planes/${plan.id}`} className={styles.actionButton}>
            Ver plan
          </Link>
        </div>
      </div>
    </div>
  );
};

// Memoizar componente para evitar re-renders innecesarios en listas
export const PlanCard = memo(PlanCardComponent);

