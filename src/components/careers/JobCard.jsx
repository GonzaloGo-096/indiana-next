/**
 * JobCard - Card de búsqueda activa
 *
 * Muestra: Buscamos, Valoramos, Nuestra propuesta con bullets
 *
 * @author Indiana Peugeot
 */

import styles from "./JobCard.module.css";

const BulletSection = ({ title, bullets }) => (
  <div className={styles.section}>
    <h4 className={styles.sectionTitle}>{title}</h4>
    <ul className={styles.bulletList}>
      {bullets.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  </div>
);

const JobCard = ({ title, buscamos, valoramos, nuestraPropuesta }) => {
  return (
    <article className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <BulletSection title={buscamos.title} bullets={buscamos.bullets} />
      <BulletSection title={valoramos.title} bullets={valoramos.bullets} />
      <BulletSection
        title={nuestraPropuesta.title}
        bullets={nuestraPropuesta.bullets}
      />
    </article>
  );
};

export default JobCard;
