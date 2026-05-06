/**
 * /trabaja-con-nosotros - Página de reclutamiento
 *
 * Estructura: Hero + Búsquedas Activas (2 cards) + Formulario de postulación
 *
 * @author Indiana Peugeot
 */

import { absoluteUrl } from "@/lib/site-url";
import HeroCareers from "@/components/careers/HeroCareers";
import ActiveSearches from "@/components/careers/ActiveSearches";
import CareersForm from "@/components/careers/CareersForm";
import styles from "./trabaja-con-nosotros.module.css";

export const metadata = {
  title: "Trabajá con nosotros",
  description:
    "Sumate a Peugeot Indiana en Tucumán. Buscamos personas comprometidas con orientación comercial o atención al cliente. Postulate y conocé nuestras búsquedas activas.",
  openGraph: {
    title: "Trabajá con nosotros | Peugeot Indiana",
    description:
      "Sumate a Peugeot Indiana. Buscamos personas comprometidas. Postulate y conocé nuestras búsquedas activas.",
    url: absoluteUrl("/trabaja-con-nosotros"),
    siteName: "Indiana Peugeot",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trabajá con nosotros | Peugeot Indiana",
    description: "Sumate a Peugeot Indiana. Postulate y conocé nuestras búsquedas activas.",
  },
  alternates: {
    canonical: absoluteUrl("/trabaja-con-nosotros"),
  },
};

export default function TrabajaConNosotrosPage() {
  return (
    <div className={styles.page}>
      <HeroCareers />
      <ActiveSearches />
      <CareersForm />
    </div>
  );
}
