"use client";

import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Link a WhatsApp que registra `whatsapp_click`, el evento clave del sitio.
 *
 * @param {object} props
 * @param {string} props.href - URL wa.me completa
 * @param {string} props.componentId - qué botón es, estable y en kebab-case
 *   (ej. "whatsapp-floating"); es lo que separa un botón de otro en GA4
 * @param {{ item_id: string, item_name: string, item_category: string } | null} [props.item]
 *   - el vehículo, si el botón es de una ficha (buildItemParamsFrom*)
 */
export default function WhatsAppLink({
  href,
  componentId,
  item,
  onClick,
  target = "_blank",
  rel = "noopener noreferrer",
  children,
  ...rest
}) {
  function handleClick(e) {
    track(EVENTS.WHATSAPP_CLICK, { component_id: componentId, ...item });
    onClick?.(e);
  }

  return (
    <a {...rest} href={href} target={target} rel={rel} onClick={handleClick}>
      {children}
    </a>
  );
}
