"use client";

import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Link `tel:` que registra `phone_click` (evento clave).
 *
 * @param {object} props
 * @param {string} props.phone - el número, con o sin formato
 * @param {string} props.componentId - qué botón es (ej. "footer-tel-posventa-taller")
 */
export default function TelLink({ phone, componentId, onClick, children, ...rest }) {
  function handleClick(e) {
    track(EVENTS.PHONE_CLICK, { component_id: componentId });
    onClick?.(e);
  }

  const href = phone ? `tel:${String(phone).replace(/[^\d+]/g, "")}` : undefined;

  return (
    <a {...rest} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
