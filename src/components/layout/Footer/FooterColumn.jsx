import styles from "./FooterColumn.module.css";

/**
 * El armazón de una columna del footer: título y contenido.
 *
 * Componente de servidor. Lo usan las tres columnas, y la de contacto pide la
 * variante porque su título va sin sangría y sus bloques van separados.
 *
 * Antes esa diferencia se aplicaba con `.column:first-child`, o sea que el
 * espaciado dependía del orden del JSX: mover una columna de lugar rompía el
 * de otra sin que nada lo advirtiera.
 *
 * @param {{titulo: string, variante?: "contacto", children: React.ReactNode}} props
 */
export default function FooterColumn({ titulo, variante, children }) {
  const clases = [styles.column];
  if (variante === "contacto") clases.push(styles.columnContacto);

  return (
    <div className={clases.join(" ")}>
      <h3 className={styles.columnTitle}>{titulo}</h3>
      <div className={styles.columnContent}>{children}</div>
    </div>
  );
}
