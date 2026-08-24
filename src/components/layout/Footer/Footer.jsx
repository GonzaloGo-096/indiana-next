import Image from "next/image";
import { NAVEGACION_FOOTER } from "./footerNav";
import FooterColumn from "./FooterColumn";
import FooterNav from "./FooterNav";
import ContactColumn from "./ContactColumn";
import styles from "./Footer.module.css";

/**
 * Pie de página del sitio: logo, tres columnas y copyright.
 *
 * La columna de contacto sale de `config/contacto`; las otras dos, de
 * `footerNav`. Lo único que corre en el navegador es abrir y cerrar los
 * acordeones.
 */
const Footer = () => {
  const anio = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="contacto" tabIndex={-1}>
      <div className={styles.footerContainer}>
        <div className={styles.header}>
          <Image
            src="/assets/logos/logos-indiana/mobile/logo-chico-solid-fallback-transparente.webp"
            alt="Indiana Usados"
            className={styles.logo}
            width={320}
            height={80}
            loading="lazy"
          />
        </div>

        <div className={styles.modulesWrapper}>
          <div className={styles.modulesGrid}>
            <ContactColumn />

            {NAVEGACION_FOOTER.map((columna) => (
              <FooterColumn key={columna.id} titulo={columna.titulo}>
                <FooterNav enlaces={columna.enlaces} />
              </FooterColumn>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {anio} Indiana Usados. Derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
