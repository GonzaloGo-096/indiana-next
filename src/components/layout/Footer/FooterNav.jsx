import Link from "next/link";
import styles from "./FooterNav.module.css";

/**
 * Lista de enlaces internos de una columna del footer.
 *
 * Componente de servidor: son enlaces que no cambian nunca, no hay motivo para
 * que el visitante descargue JavaScript para verlos.
 *
 * @param {{enlaces: {texto: string, href: string}[]}} props
 */
export default function FooterNav({ enlaces }) {
  return (
    <ul className={styles.textLinksList}>
      {enlaces.map((enlace) => (
        <li key={`${enlace.href}-${enlace.texto}`} className={styles.textLinkItem}>
          <Link href={enlace.href} className={styles.textLink}>
            {enlace.texto}
          </Link>
        </li>
      ))}
    </ul>
  );
}
