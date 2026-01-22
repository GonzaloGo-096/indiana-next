/**
 * Footer - Componente de pie de página simplificado
 * 
 * Características:
 * - Logo de marca en encabezado
 * - Tres módulos informativos data-driven
 * - Grid responsive 3→1
 * - Íconos SVG optimizados
 * - Accesibilidad completa
 * - Integrado con design tokens
 * 
 * @author Indiana Usados
 * @version 3.1.0 - Agregado logo en encabezado
 */

import FooterModules from "./FooterModules";
import styles from "./Footer.module.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="contacto" tabIndex={-1}>
      <div className={styles.container}>
        {/* ✅ LOGO ENCABEZADO */}
        <div className={styles.header}>
          <img
            src="/assets/logos/logos-indiana/mobile/logo-chico-solid-fallback-transparente.webp"
            alt="Indiana Usados"
            className={styles.logo}
            width="120"
            height="auto"
            loading="lazy"
          />
        </div>

        {/* ✅ MÓDULOS INFORMATIVOS */}
        <FooterModules />

        {/* ✅ LÍNEA DE COPYRIGHT */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Indiana Usados. Derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


