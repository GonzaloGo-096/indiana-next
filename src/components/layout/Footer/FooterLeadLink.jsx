"use client";

import { usePathname } from "next/navigation";
import WhatsAppLink from "@/components/analytics/WhatsAppLink";
import TelLink from "@/components/analytics/TelLink";
import { SOURCES, LEAD_TYPES } from "@/lib/analytics/events";
import { locationFromPathname } from "@/lib/analytics/locationFromPath";

/**
 * Los dos enlaces del footer que cuentan como lead: WhatsApp y teléfono.
 *
 * Existe por una sola razón, y conviene que esté escrita: el evento lleva un
 * `location` que sale del pathname, y `usePathname` es un hook de cliente. Sin
 * este componente, la lista entera de íconos tendría que ser cliente para poder
 * leerlo. Acá se aísla ese único dato, y todo lo que lo rodea —la lista, los
 * enlaces a Instagram y Maps, los íconos— sigue armándose en el servidor.
 *
 * @param {{
 *   tipo: "whatsapp" | "telefono",
 *   href?: string,
 *   phone: string,
 *   componentId: string,
 *   messageTemplateId?: string,
 *   className?: string,
 *   ariaLabel: string,
 *   children: React.ReactNode,
 * }} props
 */
export default function FooterLeadLink({
  tipo,
  href,
  phone,
  componentId,
  messageTemplateId,
  className,
  ariaLabel,
  children,
}) {
  const location = locationFromPathname(usePathname() || "/");

  if (tipo === "whatsapp") {
    return (
      <WhatsAppLink
        href={href}
        phone={phone}
        source={SOURCES.FOOTER}
        location={location}
        componentId={componentId}
        messageTemplateId={messageTemplateId}
        leadType={LEAD_TYPES.GENERAL_INQUIRY}
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </WhatsAppLink>
    );
  }

  return (
    <TelLink
      phone={phone}
      source={SOURCES.FOOTER}
      location={location}
      componentId={componentId}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </TelLink>
  );
}
