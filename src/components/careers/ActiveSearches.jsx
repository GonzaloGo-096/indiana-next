/**
 * ActiveSearches - Sección de búsquedas activas
 *
 * @author Indiana Peugeot
 */

import { activeSearches } from "@/lib/careers.data";
import JobCard from "./JobCard";
import styles from "./ActiveSearches.module.css";

const ActiveSearches = () => {
  return (
    <section
      className={styles.section}
      aria-labelledby="active-searches-heading"
    >
      <div className="container">
        <h2 id="active-searches-heading" className={styles.heading}>
          Búsquedas Activas
        </h2>
        <div className={styles.cardsGrid}>
          {activeSearches.map((job) => (
            <JobCard key={job.id} {...job} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActiveSearches;
