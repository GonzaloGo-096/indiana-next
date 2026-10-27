"use client";

import { useRef } from "react";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import { analyticsAceptada } from "@/lib/analytics/consent";
import { newLeadRef, withLeadRef } from "@/lib/analytics/leadRef";
import { getPageItem } from "@/lib/analytics/pageItem";

/**
 * Link a WhatsApp que registra `whatsapp_click`, el evento clave del sitio.
 *
 * Con la medición aceptada, en cada clic genera un código de referencia, lo
 * suma al mensaje y lo manda a GA4 (`lead_ref`): así un chat se puede cruzar
 * con su visita.
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
  onAuxClick,
  onMouseDown,
  target = "_blank",
  rel = "noopener noreferrer",
  children,
  ...rest
}) {
  // Referencia preparada al apretar la ruedita: Chrome toma el link para la
  // pestaña nueva antes del auxclick (probado con navegador el 2026-10-07).
  const pendiente = useRef(null);

  // Sin la medición aceptada no hay referencia: ventas la une al chat, y la
  // visita quedaría atada a alguien que no dio permiso (auditoría de
  // privacidad del 2026-10-26). El contacto se cuenta igual, sin código.
  function prepararRef(a) {
    if (!analyticsAceptada()) return undefined;
    const ref = newLeadRef();
    // El texto visible del botón no se toca (la agencia mide por ese texto).
    a.href = withLeadRef(href, ref);
    return ref;
  }

  // Se devuelve el link original apenas se abrió: si no, React no lo restaura
  // (la prop no cambió) y el próximo "copiar enlace" o "abrir en pestaña
  // nueva" salía con la referencia de este clic y sin evento.
  function restaurar(a) {
    setTimeout(() => {
      a.href = href;
    }, 0);
  }

  function registrar(ref) {
    const vehiculo = item || (itemFromPage ? getPageItem() : null);
    track(EVENTS.WHATSAPP_CLICK, { component_id: componentId, lead_ref: ref, ...vehiculo });
  }

  function handleClick(e) {
    const a = e.currentTarget;
    registrar(prepararRef(a));
    restaurar(a);
    onClick?.(e);
  }

  function handleMouseDown(e) {
    if (e.button === 1) {
      const a = e.currentTarget;
      const ref = prepararRef(a);
      pendiente.current = ref;
      // Si se suelta fuera del botón no hay auxclick: el link vuelve solo.
      setTimeout(() => {
        if (pendiente.current !== ref) return;
        pendiente.current = null;
        a.href = href;
      }, 1500);
    }
    onMouseDown?.(e);
  }

  // Clic con la ruedita: abre el chat en otra pestaña sin pasar por onClick.
  function handleAuxClick(e) {
    if (e.button === 1) {
      const a = e.currentTarget;
      registrar(pendiente.current || prepararRef(a));
      pendiente.current = null;
      restaurar(a);
    }
    onAuxClick?.(e);
  }

  return (
    <a
      {...rest}
      href={href}
      target={target}
      rel={rel}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onAuxClick={handleAuxClick}
    >
      {children}
    </a>
  );
}
