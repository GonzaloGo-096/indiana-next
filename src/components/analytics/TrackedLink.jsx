"use client";

import Link from "next/link";
import { useCallback } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";

/**
 * <Link> con tracking onClick.
 *
 * Reglas:
 * - getParams es un CALLBACK (() => params) — no objeto — para no invalidar React.memo
 *   en componentes padres con cards memoizadas (ModelCard, PlanCard).
 * - source/location/componentId son obligatorios para clicks; el helper warnea en dev si faltan.
 * - El push al dataLayer es síncrono y rápido; la navegación de Link no se bloquea.
 *
 * @param {object} props
 * @param {string} props.event - nombre del evento (EVENTS.*)
 * @param {() => Record<string, unknown>} [props.getParams]
 * @param {string} props.source
 * @param {string} props.location
 * @param {string} props.componentId
 * @param {string} props.href
 */
export default function TrackedLink({
  event,
  getParams,
  source,
  location,
  componentId,
  onClick,
  children,
  ...rest
}) {
  const handleClick = useCallback(
    (e) => {
      try {
        const extra = typeof getParams === "function" ? getParams() : {};
        pushDataLayer(event, {
          source,
          location,
          component_id: componentId,
          ...(extra || {}),
        });
      } catch {
        /* tracking no rompe la UI */
      }
      if (typeof onClick === "function") onClick(e);
    },
    [event, getParams, source, location, componentId, onClick],
  );

  return (
    <Link {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}
