"use client";

import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Link `tel:` que registra `phone_click` (un contacto; el evento clave es el generate_lead
 * que sale de él).
 *
 * @param {object} props
 * @param {string} props.phone - el número, con o sin formato
 * @param {string} props.componentId - qué botón es (ej. "footer-tel-posventa-taller")
 */
export default function TelLink({ phone, componentId, onClick, children, ...rest }) {
  const href = phone ? `tel:${String(phone).replace(/[^\d+]/g, "")}` : undefined;

  function handleClick(e) {
    // Sin número el link no llama a nadie: no es un contacto (y el puente de
    // GTM lo convertiría en generate_lead).
    if (href) track(EVENTS.PHONE_CLICK, { component_id: componentId });
    onClick?.(e);
  }

  return (
    <a {...rest} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
