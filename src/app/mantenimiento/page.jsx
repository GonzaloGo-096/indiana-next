import styles from "./mantenimiento.module.css";

export const metadata = {
  title: "Mantenimiento temporal | Indiana Peugeot",
  description: "Estamos realizando tareas de mantenimiento programado.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenancePage() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <p className={styles.kicker}>Indiana Peugeot</p>
        <h1 className={styles.title}>Sitio temporalmente en mantenimiento</h1>
        <p className={styles.text}>
          Estamos realizando mejoras para brindarte una mejor experiencia.
        </p>
        <p className={styles.help}>Volvemos en breve. Gracias por tu paciencia.</p>
      </section>
    </main>
  );
}
