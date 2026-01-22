"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "../../ui/icons/ChevronIcon";
import { PhoneIcon } from "../../ui/icons/PhoneIcon";
import { contactoModules, sitioModule, footerIcons } from "./footerConfig";
import styles from "./FooterModules.module.css";

/**
 * Componente para enlaces de texto (nuevo módulo "Sitio")
 */
const FooterTextLink = ({ item }) => {
  return (
    <li className={styles.textLinkItem}>
      <Link href={item.href} className={styles.textLink}>
        {item.text}
      </Link>
    </li>
  );
};

/**
 * Componente individual para cada ítem (solo icono como imagen o SVG)
 */
const FooterItem = ({ item }) => {
  const iconSrc = footerIcons[item.icon];
  const isSvgIcon = iconSrc === "svg"; // Teléfono usa SVG

  // Si es un enlace
  if (item.type === "link") {
    return (
      <li className={styles.moduleItem}>
        <a
          href={item.href}
          className={styles.iconLink}
          {...(item.external && {
            target: "_blank",
            rel: "noopener noreferrer",
          })}
          aria-label={
            item.external ? `${item.text} (se abre en nueva ventana)` : item.text
          }
        >
          {isSvgIcon ? (
            <PhoneIcon size={42} className={styles.iconSvg} />
          ) : (
            <img
              src={iconSrc}
              alt={item.text}
              className={`${styles.iconImage} ${item.icon === "maps" ? styles.iconImageMaps : ""} ${item.icon === "instagram" ? styles.iconImageInstagram : ""}`}
            />
          )}
        </a>
      </li>
    );
  }

  // Si es solo texto (aunque no debería usarse con el nuevo diseño)
  return (
    <li className={styles.moduleItem}>
      <span className={styles.iconLink}>
        {isSvgIcon ? (
          <PhoneIcon size={50} className={styles.iconSvg} />
        ) : (
          <img
            src={iconSrc}
            alt={item.text}
            className={`${styles.iconImage} ${item.icon === "maps" ? styles.iconImageMaps : ""} ${item.icon === "instagram" ? styles.iconImageInstagram : ""}`}
          />
        )}
      </span>
    </li>
  );
};

/**
 * Wrapper para ChevronIcon con estilos del accordion
 */
const AccordionChevron = () => (
  <ChevronIcon size={20} className={styles.chevron} />
);

/**
 * Componente para una sede individual (accordion anidado)
 */
const SedeAccordion = ({ sede, moduleId, isOpen, onToggle }) => {
  return (
    <div className={`${styles.sede} ${isOpen ? styles.sedeOpen : ""}`}>
      {/* Título de la sede clickable */}
      <button
        type="button"
        className={styles.sedeHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`sede-content-${sede.id}`}
      >
        <h4 className={styles.sedeTitle}>{sede.name}</h4>
        <AccordionChevron />
      </button>

      {/* Contenido de la sede */}
      <div id={`sede-content-${sede.id}`} className={styles.sedeContent}>
        <ul className={styles.iconsList}>
          {sede.items.map((item, index) => (
            <FooterItem key={`${sede.id}-${index}`} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Componente principal de módulos con accordion
 */
const FooterModules = () => {
  // Estado para controlar qué módulos están abiertos (por ID)
  const [openModules, setOpenModules] = useState({});
  // Estado para controlar qué sedes están abiertas (por ID)
  const [openSedes, setOpenSedes] = useState({});

  // Toggle para abrir/cerrar un módulo
  const toggleModule = (moduleId) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Toggle para abrir/cerrar una sede
  const toggleSede = (sedeId) => {
    setOpenSedes((prev) => ({
      ...prev,
      [sedeId]: !prev[sedeId],
    }));
  };

  return (
    <div className={styles.modulesWrapper}>
      <div className={styles.modulesGrid}>
        {/* COLUMNA 1: CONTACTO */}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Contacto</h3>
          <div className={styles.columnContent}>
            {contactoModules.map((module) => {
              const isOpen = openModules[module.id];
              const hasSedes = module.sedes && module.sedes.length > 0;

              return (
                <div
                  key={module.id}
                  className={`${styles.module} ${isOpen ? styles.moduleOpen : ""} ${styles.moduleAccordion}`}
                >
                  {/* Título clickable con chevron */}
                  <button
                    type="button"
                    className={styles.moduleHeader}
                    onClick={() => toggleModule(module.id)}
                    aria-expanded={isOpen}
                    aria-controls={`module-content-${module.id}`}
                  >
                    <h4 className={styles.moduleTitle}>{module.title}</h4>
                    <AccordionChevron />
                  </button>

                  {/* Contenido colapsable */}
                  <div
                    id={`module-content-${module.id}`}
                    className={styles.moduleContent}
                  >
                    {/* Si tiene sedes, renderizar accordion anidado */}
                    {hasSedes ? (
                      <div className={styles.sedesWrapper}>
                        {module.sedes.map((sede) => (
                          <SedeAccordion
                            key={sede.id}
                            sede={sede}
                            moduleId={module.id}
                            isOpen={openSedes[sede.id]}
                            onToggle={() => toggleSede(sede.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      /* Renderizar items directamente */
                      <ul className={styles.iconsList}>
                        {module.items.map((item, index) => (
                          <FooterItem key={`${module.id}-${index}`} item={item} />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA 2: SITIO (DEL MEDIO) */}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Sitio</h3>
          <div className={styles.columnContent}>
            <ul className={styles.textLinksList}>
              {sitioModule.items.map((item, index) => (
                <FooterTextLink key={`${sitioModule.id}-${index}`} item={item} />
              ))}
            </ul>
          </div>
        </div>

        {/* COLUMNA 3: ESPACIO RESERVADO */}
        <div className={styles.column}></div>
      </div>
    </div>
  );
};

export default FooterModules;


