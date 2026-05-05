"use client";

import { useCallback } from "react";
import { pushDataLayer } from "@/lib/analytics/dataLayer";
import { EVENTS, LEAD_SOURCES } from "@/lib/analytics/events";

/**
 * Link `mailto:` con tracking de email_click + generate_lead.
 * Solo se manda el dominio del destino (post-@) — el local-part se considera PII.
 */
export default function MailLink({
  email,
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
        const domain =
          typeof email === "string" && email.includes("@")
            ? email.split("@")[1]?.toLowerCase()
            : null;
        const base = {
          source,
          location,
          component_id: componentId,
          ...(domain ? { email_domain: domain } : {}),
        };
        pushDataLayer(EVENTS.EMAIL_CLICK, base);
        pushDataLayer(EVENTS.GENERATE_LEAD, {
          ...base,
          lead_source: LEAD_SOURCES.EMAIL,
        });
      } catch {
        /* noop */
      }
      if (typeof onClick === "function") onClick(e);
    },
    [email, source, location, componentId, onClick],
  );

  const href = email ? `mailto:${email}` : undefined;

  return (
    <a {...rest} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
