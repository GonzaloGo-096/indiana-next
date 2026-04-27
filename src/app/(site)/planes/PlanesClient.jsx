"use client";

import { useRef } from "react";
import { ModeloSection } from "../../../components/planes/ModeloSection";
import cta from "../../../components/home/HomeSectionCtas.module.css";
import contact from "@/components/ui/ContactButtons.module.css";
import styles from "./planes.module.css";

/**
 * Client Component para la página de planes
 * Maneja interactividad: scroll a secciones, navegación por modelos
 */
export function PlanesClient({ planesPorModelo }) {
  // Refs para las secciones de modelos
  const modeloRefs = useRef({});

  // Función para hacer scroll a una sección de modelo (centrada en la pantalla)
  const scrollToModelo = (modelo) => {
    const elemento = modeloRefs.current[modelo];
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Obtener lista de modelos disponibles
  const modelosDisponibles = Object.keys(planesPorModelo).sort();

  return (
    <>
      <header
        className={`${styles.planesHero} w-full min-w-0`}
        aria-labelledby="planes-page-titulo"
        aria-describedby="planes-page-subtitulo"
      >
        <div className={styles.planesHeroInner}>
          <div className={styles.planesHeroCopy}>
            <p className={styles.planesHeroEyebrow}>Financiación oficial Peugeot</p>
            <h1 id="planes-page-titulo" className={styles.planesHeroHeading}>
              <span className={styles.planesHeroTitleMain}>Financiá tu Peugeot</span>
              <span className={styles.planesHeroTitleTagline}>
                Asesoramiento local y planes pensados para cada modelo
              </span>
            </h1>
            <p id="planes-page-subtitulo" className={styles.planesHeroLead}>
              <strong className={styles.planesHeroLeadStrong}>Indiana Peugeot</strong>
              : <strong className={styles.planesHeroLeadStrong}>concesionario oficial</strong> en
              Tucumán. <strong className={styles.planesHeroLeadStrong}>Compará planes por modelo</strong>{" "}
              y consultá cuotas y adjudicación con nuestro equipo.
            </p>
          </div>
        </div>
      </header>

      <section
        className={`${styles.planesListado} min-w-0 w-full`}
        aria-label="Planes por modelo"
      >
        <nav
          className={styles.planesModelosBar}
          aria-labelledby="planes-modelos-label"
        >
          <p
            id="planes-modelos-label"
            className={styles.planesModelosBarLabel}
          >
            Ir a un modelo
          </p>
          <ul className={styles.planesModeloChipList} role="list">
            {modelosDisponibles.map((modelo) => {
              const modeloDisplay =
                modelo.charAt(0).toUpperCase() + modelo.slice(1);
              return (
                <li key={modelo} className={styles.planesModeloChipItem}>
                  <button
                    type="button"
                    className={cta.buttonChip}
                    onClick={() => scrollToModelo(modelo)}
                  >
                    {modeloDisplay}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`${styles.content} min-w-0 w-full`}>
          {Object.entries(planesPorModelo).map(([modelo, planes]) => (
            <div
              key={modelo}
              className={`${styles.modeloSectionAnchor} min-w-0`}
              ref={(el) => {
                if (el) {
                  modeloRefs.current[modelo] = el;
                }
              }}
            >
              <ModeloSection modelo={modelo} planes={planes} />
            </div>
          ))}
        </div>
      </section>

      <section
        className={`${styles.contactSection} min-w-0 max-w-full shadow-sm`}
        aria-labelledby="planes-contacto-titulo"
      >
        <div className={styles.contactContent}>
          <h3
            id="planes-contacto-titulo"
            className={`${styles.contactTitle} text-balance`}
          >
            ¿Necesitás asesoramiento?
          </h3>
          <p className={`${styles.contactText} text-pretty`}>
            Consultá con nuestros asesores sobre el plan que mejor se adapte a tu
            situación.
          </p>
          <a
            href="https://wa.me/543816295959?text=Hola!%20Quiero%20consultar%20sobre%20los%20planes%20de%20financiación%20Peugeot"
            className={`${contact.buttonWhatsapp} ${contact.buttonWhatsappFull}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className={contact.whatsappIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </section>
    </>
  );
}



