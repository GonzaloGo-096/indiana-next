"use client";

import { useCallback } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";

/**
 * <button> con tracking onClick.
 * Mismo contrato que TrackedLink: getParams como callback, source/location/componentId
 * obligatorios.
 */
export default function TrackedButton({
  event,
  getParams,
  source,
  location,
  componentId,
  onClick,
  type = "button",
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
        /* noop */
      }
      if (typeof onClick === "function") onClick(e);
    },
    [event, getParams, source, location, componentId, onClick],
  );

  return (
    <button {...rest} type={type} onClick={handleClick}>
      {children}
    </button>
  );
}
