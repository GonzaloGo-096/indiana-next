"use client";

/**
 * CardAuto - Componente para mostrar información de un vehículo
 * 
 * Rediseño Premium v6.0.0:
 * - Jerarquía visual clara y profesional
 * - Diseño limpio, respirable y consistente
 * - Paleta sobria (blancos, grises, negro)
 * - Color de acento solo para precio
 * - Performance optimizada
 * - Escalable a futuro (favoritos, badges, etc.)
 * 
 * @author Indiana Peugeot
 * @version 6.0.0 - Migración desde React a Next.js
 */

import { memo, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  formatKilometraje,
  formatYear,
  formatCaja,
  formatBrandModel,
  formatValue,
  formatCilindradaDisplay,
  formatHPDisplay,
} from "../../../../utils/formatters";
import { getBrandLogo } from "../../../../utils/getBrandLogo";
import { getBlurPlaceholder } from "../../../../utils/imageBlur";
import { STORAGE_KEYS } from "../../../../constants/storageKeys";
import styles from "./CardAuto.module.css";

/**
 * Componente CardAuto optimizado
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.auto - Objeto con información del vehículo
 * @param {string} props.imagePriority - Prioridad de carga de imagen: "high" | "auto" | "low"
 */
export const CardAuto = memo(({ auto, imagePriority = "auto" }) => {
  const router = useRouter();

  // ✅ VALIDAR DATOS DEL VEHÍCULO
  const isValidAuto = auto && (auto.id || auto._id);

  // ✅ URL de imagen principal optimizada con useMemo
  const primaryImage = useMemo(() => {
    if (!auto) return "/auto1.jpg";
    return auto.fotoPrincipal || auto.imagen || "/auto1.jpg";
  }, [auto]);

  // ✅ Blur placeholder para mejorar percepción de carga
  const blurDataURL = useMemo(() => {
    return getBlurPlaceholder(primaryImage);
  }, [primaryImage]);

  // ✅ HANDLER: Click en toda la tarjeta para abrir detalle
  const handleCardClick = useCallback((e) => {
    if (!auto) return;
    const vehicleId = auto.id || auto._id;
    if (!vehicleId) {
      if (process.env.NODE_ENV === 'development') {
        console.error("[CardAuto] ID del vehículo no válido");
      }
      return;
    }
    
    // ✅ Guardar posición de scroll antes de navegar
    if (typeof window !== "undefined") {
      const scrollData = {
        position: window.scrollY,
        path: "/usados/vehiculos",
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL, JSON.stringify(scrollData));
    }
    
    // Permitir que el Link navegue normalmente
  }, [auto]);

  // ✅ MEMOIZAR DATOS FORMATEADOS
  const formattedData = useMemo(() => {
    if (!auto) {
      return {
        price: "",
        kilometers: "",
        year: "",
        caja: "",
        brandModel: "",
        version: "",
        cilindrada: "",
        HP: "",
        traccion: "",
      };
    }

    const cajaFormateada = formatCaja(auto.caja);

    return {
      price: formatPrice(auto.precio),
      kilometers: formatKilometraje(auto.kilometraje || auto.kms),
      year: formatYear(auto.anio || auto.año),
      caja: cajaFormateada,
      brandModel: formatBrandModel(auto.marca, auto.modelo),
      version: formatValue(auto.version || ""),
      cilindrada: formatCilindradaDisplay(auto.cilindrada || ""),
      HP: formatHPDisplay(auto.HP || ""),
      traccion: formatValue(auto.traccion || ""),
    };
  }, [auto]);

  // ✅ Detectar si es "Automática" para aplicar estilos especiales
  const isAutomatica = useMemo(() => {
    return formattedData.caja === "Automática";
  }, [formattedData.caja]);

  // ✅ MEMOIZAR LOGO DE MARCA
  const brandLogo = useMemo(() => {
    return getBrandLogo(auto?.marca || "");
  }, [auto]);

  // ✅ DATOS PRINCIPALES (Caja, Km, Año)
  const mainData = useMemo(
    () => [
      { label: "Caja", value: formattedData.caja },
      { label: "Km", value: formattedData.kilometers },
      { label: "Año", value: formattedData.year },
    ],
    [formattedData.year, formattedData.kilometers, formattedData.caja]
  );

  // ✅ MEMOIZAR ALT TEXT
  const altText = useMemo(() => {
    if (!formattedData.brandModel || !formattedData.year) {
      return "Vehículo";
    }
    return `${formattedData.brandModel} - ${formattedData.year}`;
  }, [formattedData.brandModel, formattedData.year]);

  // ✅ VALIDAR DATOS DEL VEHÍCULO - Early return después de todos los hooks
  if (!isValidAuto) {
    return null;
  }

  const vehicleId = auto.id || auto._id;

  return (
    <Link
      href={`/usados/${vehicleId}`}
      className={styles.card}
      data-testid="vehicle-card"
      data-vehicle-id={vehicleId}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      aria-label={`Ver detalles de ${formattedData.brandModel}`}
    >
      {/* ===== IMAGEN PRINCIPAL ===== */}
      <div className={styles["card__image-container"]}>
        <Image
          src={primaryImage}
          alt={altText}
          fill
          className={styles["card__image"]}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={imagePriority === "high"}
          loading={imagePriority === "high" ? "eager" : "lazy"}
          quality={80}
          placeholder="blur"
          blurDataURL={blurDataURL}
        />
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className={styles["card__body"]}>
        {/* CONTENEDOR 1: Datos primero + Logo después (orden invertido) */}
        <div className={styles.container1}>
          {/* Bloque de datos primero */}
          <div className={styles.container1_right}>
            {/* Fila 1: Marca + Modelo + Versión */}
            <div className={styles.container1_row1}>
              <span className={styles.marca_text}>{auto.marca}</span>
              <span className={styles.marca_modelo_separator}>|</span>
              <h3 className={styles.modelo_title}>{auto.modelo}</h3>
              {formattedData.version && formattedData.version !== "-" && (
                <span className={styles.version_text}>
                  {formattedData.version}
                </span>
              )}
            </div>

            {/* Fila 2: Caja, Km, Año (sin separadores) */}
            <div
              className={`${styles.container1_row3} ${
                isAutomatica ? styles.container1_row3_automatica : ""
              }`}
            >
              {mainData.map((item) => {
                const isCajaItem = item.label === "Caja";
                const isCajaAutomatica = isCajaItem && isAutomatica;

                return (
                  <div
                    key={item.label}
                    className={`${styles.row2_data_item} ${
                      isCajaAutomatica ? styles.row2_data_item_automatica : ""
                    }`}
                  >
                    <div className={styles.row2_data_content}>
                      <span className={styles.row2_data_label}>
                        {item.label}
                      </span>
                      <span className={styles.row2_data_value}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logo después de los datos */}
          <div className={styles.container1_left}>
            <Image
              src={brandLogo.src}
              alt={brandLogo.alt}
              width={60}
              height={60}
              className={`${styles.brand_logo} ${
                brandLogo.size === "small" ? styles.brand_logo_small : ""
              } ${brandLogo.size === "large" ? styles.brand_logo_large : ""}`}
              loading="lazy"
            />
          </div>
        </div>

        {/* CONTENEDOR 4: Precio dividido en 2 contenedores */}
        <div className={styles.container4}>
          {/* Contenedor izquierda: "Desde:" con contenido futuro */}
          <div className={styles.price_label_container}>
            <span className={styles.price_label}>desde:</span>
          </div>

          {/* Contenedor derecha: Precio alineado a la derecha */}
          <div className={styles.price_display}>
            <span className={styles.price_value}>{formattedData.price}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

CardAuto.displayName = "CardAuto";

export default CardAuto;

