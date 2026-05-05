"use client";

import { memo, useCallback } from "react";
import { formatPrice } from "../../utils/formatters";
import { getModelo } from "../../data/modelos";
import TrackedLink from "@/components/analytics/TrackedLink";
import {
  EVENTS,
  SOURCES,
  LOCATIONS,
  ITEM_LIST,
} from "@/lib/analytics/events";
import { buildItemParamsFromPlan } from "@/lib/analytics/params";
import cta from "../home/HomeSectionCtas.module.css";
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

  // Callback (no objeto) para no invalidar React.memo en re-renders del padre.
  const getTrackParams = useCallback(
    () =>
      buildItemParamsFromPlan(
        { id: plan.id, nombre: nombrePlan, modelo, cuota: cuotas_desde },
        ITEM_LIST.PLANES_GRID,
      ) || {},
    [plan.id, nombrePlan, modelo, cuotas_desde],
  );

  const modeloDisplay = modelo.charAt(0).toUpperCase() + modelo.slice(1);
  const modeloLower = modelo.toLowerCase();
  const version = obtenerVersionDelPlan(plan, modelo);
  const cuotasTotales = caracteristicas?.cuotas_totales || null;

  // Solo mostrar modelo en el título si es 208
  const mostrarModeloEnVersion = modeloLower === "208";

  // Para 2008: no mostrar la versión al final del título
  const mostrarVersion = modeloLower !== "2008";

  return (
    <div className={styles.planCard}>
      {/* Header del plan - Alineado a la izquierda */}
      <div className={styles.planHeader}>
        <h3 className={styles.planTitle}>
          Plan {nombrePlan}
          {mostrarVersion && version && (
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

      {/* Información principal - flex:1 para que el botón quede abajo */}
      <div className={styles.planContent}>
        <div className={styles.planContentInner}>
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
              <div className={styles.cuotaDesdeItem}>
                <span className={styles.cuotaDesdeLabel}>Cantidad de cuotas</span>
                <span className={styles.cuotaDesdeValue}>{cuotasTotales}</span>
              </div>
            )}
          </div>
        </div>

        {/* Valor móvil: solo estos dos datos, más visibles */}
        <div className={styles.infoBottomRow}>
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
        </div>

        {/* Botones de acción - siempre abajo con margin-top: auto */}
        <div className={styles.planActions}>
          <TrackedLink
            href={`/planes/${plan.id}`}
            event={EVENTS.SELECT_ITEM}
            getParams={getTrackParams}
            source={SOURCES.CARD}
            location={LOCATIONS.PLANES_LIST}
            componentId="plan-card-cta-ver"
            className={`${cta.button} ${cta.buttonWhite} ${cta.buttonInCard} ${styles.actionButton}`}
          >
            Ver plan
          </TrackedLink>
        </div>
      </div>
    </div>
  );
};

// Memoizar componente para evitar re-renders innecesarios en listas
export const PlanCard = memo(PlanCardComponent);

