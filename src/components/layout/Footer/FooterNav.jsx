import Link from "next/link";
import styles from "./FooterNav.module.css";

/**
 * Lista de enlaces internos de una columna del footer.
 *
 * Componente de servidor: son enlaces que no cambian nunca, no hay motivo para
 * que el visitante descargue JavaScript para verlos.
 *
 * Va dentro de un `nav` con nombre: son enlaces de navegación, y sin eso
 * quien salta entre regiones con lector de pantalla no las encuentra.
 *
 * @param {{titulo: string, enlaces: {texto: string, href: string}[]}} props
 */
export default function FooterNav({ titulo, enlaces }) {
  return (
    <nav aria-label={titulo}>
      <ul className={styles.textLinksList}>
        {enlaces.map((enlace) => (
          <li
            key={`${enlace.href}-${enlace.texto}`}
            className={styles.textLinkItem}
          >
            <Link href={enlace.href} className={styles.textLink}>
              {enlace.texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
