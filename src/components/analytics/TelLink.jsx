"use client";

import { useCallback, useEffect, useState } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS, LEAD_SOURCES } from "@/lib/analytics/events";
import { hashPhoneNumber } from "@/lib/analytics/params";

/**
 * Link `tel:` con tracking de phone_click + generate_lead.
 * Recibe el número en `phone` (string en E.164 o texto, se sanitiza al hashear).
 */
export default function TelLink({
  phone,
  source,
  location,
  componentId,
  onClick,
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
        };
        pushDataLayer(EVENTS.PHONE_CLICK, base);
        pushDataLayer(EVENTS.GENERATE_LEAD, {
          ...base,
          lead_source: LEAD_SOURCES.PHONE,
        });
      } catch {
        /* noop */
      }
      if (typeof onClick === "function") onClick(e);
    },
    [source, location, componentId, phoneHash, onClick],
  );

  const href = phone ? `tel:${String(phone).replace(/[^\d+]/g, "")}` : undefined;

  return (
    <a {...rest} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
