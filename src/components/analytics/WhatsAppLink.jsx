"use client";

import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import { newLeadRef, withLeadRef } from "@/lib/analytics/leadRef";
import { getPageItem } from "@/lib/analytics/pageItem";

/**
 * Link a WhatsApp que registra `whatsapp_click`, el evento clave del sitio.
 *
 * En cada clic genera un código de referencia, lo suma al mensaje y lo manda
 * a GA4 (`lead_ref`): así un chat se puede cruzar con su visita.
 *
 * @param {object} props
 * @param {string} props.href - URL wa.me / api.whatsapp.com completa
 * @param {string} props.componentId - qué botón es, estable y en kebab-case
 *   (ej. "whatsapp-floating"); es lo que separa un botón de otro en GA4
 * @param {{ item_id: string, item_name: string, item_category: string } | null} [props.item]
 *   - el vehículo, si el botón es de una ficha (buildItemParamsFrom*)
 * @param {boolean} [props.itemFromPage] - sin `item`, usar el de la ficha
 *   abierta (lo usa el flotante, que no sabe en qué ficha está)
 */
export default function WhatsAppLink({
  href,
  componentId,
  item,
  itemFromPage = false,
  onClick,
  target = "_blank",
  rel = "noopener noreferrer",
  children,
  ...rest
}) {
  function handleClick(e) {
    const ref = newLeadRef();
    // Se cambia el href justo antes de que el navegador lo abra; el texto
    // visible del botón no se toca (la agencia mide por ese texto).
    e.currentTarget.href = withLeadRef(href, ref);
    const vehiculo = item || (itemFromPage ? getPageItem() : null);
    track(EVENTS.WHATSAPP_CLICK, { component_id: componentId, lead_ref: ref, ...vehiculo });
    onClick?.(e);
  }

  return (
    <a {...rest} href={href} target={target} rel={rel} onClick={handleClick}>
      {children}
    </a>
  );
}
