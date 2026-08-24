import { PhoneIcon } from "@/components/ui/icons/PhoneIcon";
import { urlWhatsApp, urlInstagram, urlMapa } from "@/lib/contacto/urls";
import FooterLeadLink from "./FooterLeadLink";
import styles from "./ContactLinks.module.css";

/**
 * La fila de íconos de una sede: WhatsApp, Instagram, teléfono y mapa.
 *
 * Componente de servidor. Solo los dos que cuentan como lead viajan al
 * navegador, y por un motivo acotado (ver FooterLeadLink).
 *
 * Ojo con lo que este componente NO hace: hoy el texto de cada ítem —el número,
 * la dirección, el usuario de Instagram— no se muestra en pantalla. Vive
 * únicamente en el `aria-label`, así que quien mira la pantalla ve cuatro
 * íconos y nada más. Se conserva tal cual porque este trabajo no cambia el
 * aspecto, pero es una decisión de diseño que conviene revisar.
 */

const IMAGENES = {
  whatsapp: "/assets/redes/Whatsapp_logo_PNG8.webp",
  instagram: "/assets/redes/Instagram_logo_PNG8.webp",
  maps: "/assets/redes/Google-Maps-logo-1.webp",
};

/** El teléfono es el único que se dibuja con un SVG y no con una imagen. */
function Icono({ nombre, alt }) {
  if (nombre === "telefono") {
    return <PhoneIcon size={42} className={styles.iconSvg} />;
  }

  const clases = [styles.iconImage];
  if (nombre === "maps") clases.push(styles.iconImageMaps);
  if (nombre === "instagram") clases.push(styles.iconImageInstagram);

  return (
    <img src={IMAGENES[nombre]} alt={alt} className={clases.join(" ")} />
  );
}

/** Enlace que sale del sitio: no se trackea como lead. */
function EnlaceExterno({ href, texto, icono }) {
  return (
    <li className={styles.moduleItem}>
      <a
        href={href}
        className={styles.iconLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${texto} (se abre en nueva ventana)`}
      >
        <Icono nombre={icono} alt={texto} />
      </a>
    </li>
  );
}

/**
 * @param {{sede: import("@/config/contacto").Sede}} props
 */
export default function ContactLinks({ sede }) {
  return (
    <ul className={styles.iconsList}>
      <li className={styles.moduleItem}>
        <FooterLeadLink
          tipo="whatsapp"
          href={urlWhatsApp(sede.whatsapp)}
          phone={sede.whatsapp.phone}
          componentId={`footer-whatsapp-${sede.id}`}
          messageTemplateId={sede.id}
          className={styles.iconLink}
          ariaLabel="WhatsApp (se abre en nueva ventana)"
        >
          <Icono nombre="whatsapp" alt="WhatsApp" />
        </FooterLeadLink>
      </li>

      <EnlaceExterno
        href={urlInstagram(sede.instagram)}
        texto={`@${sede.instagram}`}
        icono="instagram"
      />

      <li className={styles.moduleItem}>
        <FooterLeadLink
          tipo="telefono"
          phone={sede.telefono.e164}
          componentId={`footer-tel-${sede.id}`}
          className={styles.iconLink}
          ariaLabel={sede.telefono.texto}
        >
          <Icono nombre="telefono" alt={sede.telefono.texto} />
        </FooterLeadLink>
      </li>

      <EnlaceExterno
        href={urlMapa(sede.direccion)}
        texto={sede.direccion}
        icono="maps"
      />
    </ul>
  );
}
