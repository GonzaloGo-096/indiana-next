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

import { memo, useMemo, useCallback, useState } from "react";
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
} from "@/utils/formatters";
import { getBrandLogo } from "@/utils/getBrandLogo";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { buildVehicleDetailUrl } from "@/utils/vehicleSlug";
import { getVehicleOfferDisplay } from "@/utils/vehicleOffer";
import { VehiclePrice } from "@/components/vehicles/VehiclePrice/VehiclePrice";
import { pushEcommerceEvent } from "@/lib/analytics/dataLayer";
import { EVENTS, SOURCES, LOCATIONS, ITEM_LIST } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";
import styles from "./CardAuto.module.css";
import { VEHICLE_PLACEHOLDER } from "@/config/cloudinaryStaticImages";

/**
 * Componente CardAuto optimizado
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.auto - Objeto con información del vehículo
 * @param {string} props.imagePriority - Prioridad de carga de imagen: "high" | "auto" | "low"
 */
export const CardAuto = memo(({ auto, imagePriority = "auto", index = 0 }) => {
  // ✅ VALIDAR DATOS DEL VEHÍCULO
  const isValidAuto = auto && (auto.id || auto._id);

  // ✅ URL de imagen principal optimizada con useMemo
  const primaryImage = useMemo(() => {
    if (!auto) return VEHICLE_PLACEHOLDER;
    return auto.fotoPrincipal || auto.imagen || VEHICLE_PLACEHOLDER;
  }, [auto]);

  // ✅ Estado de carga de imagen para shimmer
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const handleImageLoad = useCallback(() => setIsImageLoaded(true), []);

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

    // Analytics: select_item con wrapper ecommerce estándar GA4
    const itemParams = buildItemParamsFromUsado(auto, ITEM_LIST.USADOS_GRID);
    if (itemParams) {
      pushEcommerceEvent(EVENTS.SELECT_ITEM, {
        source: SOURCES.CARD,
        location: LOCATIONS.USADOS_LIST,
        component_id: "vehicle-card-vehiculos-grid",
        item_id: itemParams.item_id,
        item_name: itemParams.item_name,
        item_category: itemParams.item_category,
        itemListName: ITEM_LIST.USADOS_GRID,
        items: [{ ...itemParams, index }],
      });
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
  }, [auto]);

  const offerData = useMemo(() => getVehicleOfferDisplay(auto), [auto]);

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

  // ✅ Evitar crear objeto style en cada render (solo cuando hay ajustes por marca)
  const logoWrapperStyle = useMemo(() => {
    if (
      brandLogo.scale == null &&
      brandLogo.offsetY == null &&
      brandLogo.offsetX == null
    )
      return undefined;
    return {
      "--logo-scale": brandLogo.scale ?? 1,
      "--logo-offset-y":
        brandLogo.offsetY != null ? `${brandLogo.offsetY}px` : "0px",
      "--logo-offset-x":
        brandLogo.offsetX != null ? `${brandLogo.offsetX}px` : "0px",
    };
  }, [brandLogo.scale, brandLogo.offsetY, brandLogo.offsetX]);

  // ✅ DATOS PRINCIPALES (Año, Km, Caja)
  const mainData = useMemo(
    () => [
      { label: "Año", value: formattedData.year },
      { label: "Km", value: formattedData.kilometers },
      { label: "Caja", value: formattedData.caja },
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
  const detailUrl = buildVehicleDetailUrl(auto);

  return (
    <Link
      href={detailUrl}
      className={styles.card}
      data-testid="vehicle-card"
      data-vehicle-id={vehicleId}
      onClick={handleCardClick}
      aria-label={`Ver detalles de ${formattedData.brandModel}`}
    >
      <div className={styles.cardInner}>
      {/* ===== IMAGEN PRINCIPAL ===== */}
      <div className={`${styles["card__image-container"]} ${!isImageLoaded ? styles["card__image-container--loading"] : ""}`}>
        {offerData.hasOffer && (
          <span
            className={styles.discount_badge}
            aria-label="Oportunidad de oferta"
          >
            Oportunidad
          </span>
        )}
        <Image
          src={primaryImage}
          alt={altText}
          fill
          className={`${styles["card__image"]} ${isImageLoaded ? styles["card__image--loaded"] : ""}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={imagePriority === "high"}
          loading={imagePriority === "high" ? "eager" : "lazy"}
          quality={80}
          onLoad={handleImageLoad}
          onError={handleImageLoad}
        />
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className={styles["card__body"]}>
        {/* CONTENEDOR 1: Datos primero + Logo después (orden invertido) */}
        <div className={styles.container1}>
          {/* Bloque de datos primero */}
          <div className={styles.container1_right}>
            {/* Fila 1: Marca + Modelo */}
            <div className={styles.container1_row1}>
              <span className={styles.marca_text}>{auto.marca}</span>
              <span className={styles.marca_modelo_separator}>|</span>
              <h3 className={styles.modelo_title}>{auto.modelo}</h3>
            </div>

            {/* Fila 2: Versión (siempre debajo de marca/modelo) */}
            {formattedData.version && formattedData.version !== "-" && (
              <div className={styles.container1_row_version}>
                <span className={styles.version_text}>
                  {formattedData.version}
                </span>
              </div>
            )}

            {/* Fila 3: Año, Km, Caja (sin separadores) */}
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

          {/* Logo después de los datos (ajustes por marca vía CSS variables) */}
          <div className={styles.container1_left}>
            <div
              className={styles.brand_logo_wrapper}
              style={logoWrapperStyle}
            >
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
        </div>

        {/* CONTENEDOR 4: Precio */}
        <div className={styles.container4}>
          <VehiclePrice
            styles={styles}
            offer={offerData}
            fallbackPrice={formattedData.price}
          />
        </div>
      </div>
      </div>
    </Link>
  );
});

CardAuto.displayName = "CardAuto";

export default CardAuto;

