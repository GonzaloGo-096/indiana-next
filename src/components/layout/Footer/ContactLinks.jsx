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

/**
 * Las medidas son las del archivo, no las que se ven: el CSS encaja cada una en
 * una caja cuadrada con object-fit. Van igual porque son lo que el navegador
 * necesita para reservar el espacio si la hoja de estilos todavía no llegó.
 */
const IMAGENES = {
  whatsapp: {
    src: "/assets/redes/Whatsapp_logo_PNG8.webp",
    ancho: 256,
    alto: 182,
  },
  instagram: {
    src: "/assets/redes/Instagram_logo_PNG8.webp",
    ancho: 256,
    alto: 256,
  },
  maps: {
    src: "/assets/redes/Google-Maps-logo-1.webp",
    ancho: 256,
    alto: 144,
  },
};

/**
 * El teléfono es el único que se dibuja con un SVG y no con una imagen.
 *
 * El ícono va sin texto alternativo a propósito: es decorativo, y el nombre
 * accesible ya lo pone el enlace que lo envuelve. Con los dos, el lector de
 * pantalla anunciaba "WhatsApp, se abre en nueva ventana, WhatsApp".
 */
function Icono({ nombre }) {
  if (nombre === "telefono") {
    return <PhoneIcon size={42} className={styles.iconSvg} />;
  }

  const clases = [styles.iconImage];
  if (nombre === "maps") clases.push(styles.iconImageMaps);
  if (nombre === "instagram") clases.push(styles.iconImageInstagram);

  const imagen = IMAGENES[nombre];

  return (
    <img
      src={imagen.src}
      alt=""
      width={imagen.ancho}
      height={imagen.alto}
      // Los dieciséis íconos están debajo del pliegue y dentro de paneles
      // cerrados: no hay motivo para bajarlos con el resto de la página.
      loading="lazy"
      className={clases.join(" ")}
    />
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
        <Icono nombre={icono} />
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
          <Icono nombre="whatsapp" />
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
          <Icono nombre="telefono" />
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
