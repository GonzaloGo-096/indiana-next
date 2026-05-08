"use client";

import { useCallback, useEffect, useState } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS, LEAD_SOURCES } from "@/lib/analytics/events";
import { hashPhoneNumber } from "@/lib/analytics/params";

/**
 * Link a WhatsApp con tracking de whatsapp_click + generate_lead.
 *
 * Props mínimos: href (URL completa wa.me), source, location, componentId.
 * Opcionales: phone (para hashear y mandar phone_number_hash, sin PII),
 * item (objeto del builder buildItemParamsFromX para asociar al lead),
 * messageTemplateId, target/rel (overrides).
 *
 * El hash del teléfono se calcula en mount (async) y se manda solo si está listo
 * en el momento del click. Si no, se manda el evento sin él.
 */
export default function WhatsAppLink({
  href,
  phone,
  source,
  location,
  componentId,
  item,
  messageTemplateId,
  leadType,
  vertical,
  onClick,
  target = "_blank",
  rel = "noopener noreferrer",
  children,
  ...rest
}) {
  const [phoneHash, setPhoneHash] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!phone) return undefined;
    hashPhoneNumber(phone).then((h) => {
      if (!cancelled) setPhoneHash(h);
    });
    return () => {
      cancelled = true;
    };
  }, [phone]);

  const handleClick = useCallback(
    (e) => {
      try {
        const base = {
          source,
          location,
          component_id: componentId,
          ...(phoneHash ? { phone_number_hash: phoneHash } : {}),
          ...(messageTemplateId ? { message_template_id: messageTemplateId } : {}),
          ...(leadType ? { lead_type: leadType } : {}),
          ...(vertical ? { vertical } : {}),
          ...(item || {}),
        };
        pushDataLayer(EVENTS.WHATSAPP_CLICK, {
          ...base,
          lead_source: LEAD_SOURCES.WHATSAPP,
        });
        pushDataLayer(EVENTS.GENERATE_LEAD, {
          ...base,
          lead_source: LEAD_SOURCES.WHATSAPP,
        });
      } catch {
        /* noop */
      }
      if (typeof onClick === "function") onClick(e);
    },
    [source, location, componentId, phoneHash, messageTemplateId, leadType, vertical, item, onClick],
  );

  return (
    <a {...rest} href={href} target={target} rel={rel} onClick={handleClick}>
      {children}
    </a>
  );
}
