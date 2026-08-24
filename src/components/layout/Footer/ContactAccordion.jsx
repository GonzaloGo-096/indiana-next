"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/ui/icons/ChevronIcon";
import styles from "./ContactAccordion.module.css";

/**
 * Un bloque que abre y cierra. Es lo único del footer que corre en el
 * navegador.
 *
 * No sabe qué contiene: el contenido llega por `children` ya armado desde el
 * servidor. Ese corte es lo que permite que la lista de íconos, los enlaces a
 * Instagram y Maps y las imágenes no viajen al cliente.
 *
 * Hay dos niveles porque Peugeot tiene dos sedes adentro de un mismo bloque.
 * Es la misma interacción a dos profundidades: cambia cómo se ve y el prefijo
 * del id, no lo que hace.
 *
 * @param {{
 *   titulo: string,
 *   id: string,
 *   nivel?: "area" | "sede",
 *   children: React.ReactNode,
 * }} props
 */
export default function ContactAccordion({
  titulo,
  id,
  nivel = "area",
  children,
}) {
  // Arranca en undefined y no en false a propósito: es lo que hace el footer
  // de hoy, y React omite los aria-* con ese valor. Está mal —el botón no se
  // anuncia como desplegable hasta el primer clic— y se corrige junto con el
  // resto de la accesibilidad, no en este paso, que solo muda el código.
  const [abierto, setAbierto] = useState(undefined);

  const esArea = nivel === "area";
  const idContenido = `${esArea ? "module" : "sede"}-content-${id}`;

  const clasesRaiz = [esArea ? styles.module : styles.sede];
  if (abierto) clasesRaiz.push(esArea ? styles.moduleOpen : styles.sedeOpen);

  return (
    <div className={clasesRaiz.join(" ")}>
      <button
        type="button"
        className={esArea ? styles.moduleHeader : styles.sedeHeader}
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        aria-controls={idContenido}
      >
        <h4 className={esArea ? styles.moduleTitle : styles.sedeTitle}>
          {titulo}
        </h4>
        <ChevronIcon size={20} className={styles.chevron} />
      </button>

      <div
        id={idContenido}
        className={esArea ? styles.moduleContent : styles.sedeContent}
      >
        {children}
      </div>
    </div>
  );
}
