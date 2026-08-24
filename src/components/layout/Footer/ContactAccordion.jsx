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
  const [abierto, setAbierto] = useState(false);

  const esArea = nivel === "area";
  const idContenido = `${esArea ? "module" : "sede"}-content-${id}`;

  const clasesRaiz = [esArea ? styles.module : styles.sede];
  if (abierto) clasesRaiz.push(esArea ? styles.moduleOpen : styles.sedeOpen);

  return (
    <div className={clasesRaiz.join(" ")}>
      {/* El encabezado envuelve al boton y no al reves. Asi el titulo sigue
          apareciendo en la lista de encabezados del lector de pantalla y el
          boton queda como lo que es: el control que abre y cierra. */}
      <h4 className={styles.encabezado}>
        <button
          type="button"
          className={esArea ? styles.moduleHeader : styles.sedeHeader}
          onClick={() => setAbierto((previo) => !previo)}
          aria-expanded={abierto}
          aria-controls={idContenido}
        >
          <span className={esArea ? styles.moduleTitle : styles.sedeTitle}>
            {titulo}
          </span>
          <ChevronIcon size={20} className={styles.chevron} />
        </button>
      </h4>

      {/* `inert` y no `hidden`: hidden es display:none y mata la animación de
          apertura. inert lo saca del recorrido de teclado y del árbol de
          accesibilidad, y de esconderlo se encarga el grid de acá abajo. */}
      <div
        id={idContenido}
        className={esArea ? styles.moduleContent : styles.sedeContent}
        inert={!abierto}
      >
        {/* El truco de 0fr → 1fr necesita exactamente un hijo, y es el que
            recorta mientras el panel se abre. */}
        <div className={styles.panelInterior}>{children}</div>
      </div>
    </div>
  );
}
