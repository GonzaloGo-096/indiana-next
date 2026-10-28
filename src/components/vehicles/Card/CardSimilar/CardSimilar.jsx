"use client";

/**
 * CardSimilar - Card compacta para carruseles de vehículos similares
 * 
 * Variante de CardAuto diseñada para carruseles horizontales:
 * - Sin logo de marca (más compacta)
 * - Ancho adaptable al contenido (más fina)
 * - Layout optimizado para espacios reducidos
 * - Mantiene la funcionalidad y estética de CardAuto
 * 
 * @author Indiana Peugeot
 * @version 1.0.0 - Next.js migrado
 */

import { memo, useMemo, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  formatPrice,
  formatKilometraje,
  formatYear,
  formatCaja,
  formatBrandModel,
  formatValue,
} from "@/utils/formatters";
import { AnioIcon } from "@/components/ui/icons/AnioIcon";
import { KmIcon } from "@/components/ui/icons/KmIcon";
import { CajaIconDetalle } from "@/components/ui/icons/CajaIconDetalle";
import { STORAGE_KEYS } from "@/constants/storageKeys";
import { buildVehicleDetailUrl } from "@/utils/vehicleSlug";
import { getVehicleOfferDisplay } from "@/utils/vehicleOffer";
import { VehiclePrice } from "@/components/vehicles/VehiclePrice/VehiclePrice";
import styles from "./CardSimilar.module.css";
import { VEHICLE_PLACEHOLDER } from "@/config/cloudinaryStaticImages";

/**
 * Componente CardSimilar optimizado
 *
 * @param {Object} props
 * @param {Object} props.auto - Datos del vehículo
 * @param {boolean} props.isPriority - Si es una de las primeras imágenes (LCP)
 * @param {boolean} props.usadosCarousel - Más padding/gap en cuerpo (solo carrusel Usados)
 */
export const CardSimilar = memo(({
  auto,
  isPriority = false,
  usadosCarousel = false,
}) => {
  const vehicleId = auto?.id || auto?._id;

  // ✅ URL de imagen principal optimizada
  const primaryImage = useMemo(() => {
    if (!auto) return VEHICLE_PLACEHOLDER;
    return auto.fotoPrincipal || auto.imagen || VEHICLE_PLACEHOLDER;
  }, [auto]);

  // URL del detalle — usada como href del <Link>
  const detailUrl = useMemo(() => {
    if (!auto || !vehicleId) return "";
    return buildVehicleDetailUrl(auto);
  }, [auto, vehicleId]);

  // Guarda el scroll antes de ir al detalle. La navegación la hace el <Link>
  // para evitar doble disparo con router.push() y aprovechar el prefetch.
  const handleCardClick = useCallback(() => {
    if (!vehicleId) return;

    if (typeof window !== "undefined") {
      const scrollData = {
        position: window.scrollY,
        path: "/usados/vehiculos",
        timestamp: Date.now(),
      };
      sessionStorage.setItem(STORAGE_KEYS.VEHICLES_LIST_SCROLL, JSON.stringify(scrollData));
    }
  }, [vehicleId]);

  // ✅ MEMOIZAR DATOS FORMATEADOS
  const formattedData = useMemo(() => {
    if (!auto) {
      return {
        price: formatPrice(undefined),
        kilometers: formatKilometraje(undefined),
        year: formatYear(undefined),
        caja: formatCaja(undefined),
        brandModel: formatBrandModel(undefined, undefined),
        version: formatValue(""),
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
    };
  }, [auto]);

  // ✅ Detectar si es "Automática" para aplicar estilos especiales
  const isAutomatica = useMemo(() => {
    return formattedData.caja === "Automática";
  }, [formattedData.caja]);

  // ✅ DATOS PRINCIPALES CON ICONOS (Año, Km, Caja)
  const mainData = useMemo(
    () => [
      { label: "Año", value: formattedData.year, icon: AnioIcon },
      { label: "Km", value: formattedData.kilometers, icon: KmIcon },
      { label: "Caja", value: formattedData.caja, icon: CajaIconDetalle },
    ],
    [formattedData.year, formattedData.kilometers, formattedData.caja]
  );

  // ✅ MEMOIZAR ALT TEXT
  const altText = useMemo(() => {
    return `${formattedData.brandModel} - ${formattedData.year}`;
  }, [formattedData.brandModel, formattedData.year]);

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const handleImageLoad = useCallback(() => setIsImageLoaded(true), []);

  const offer = useMemo(() => getVehicleOfferDisplay(auto), [auto]);

  // ✅ VALIDAR DATOS DEL VEHÍCULO (después de todos los hooks)
  if (!auto || (!auto.id && !auto._id)) {
    return null;
  }

  return (
    <Link
      href={detailUrl}
      className={`${styles.card}${usadosCarousel ? ` ${styles.cardUsadosCarousel}` : ""}`}
      data-testid="vehicle-card-similar"
      data-vehicle-id={vehicleId}
      onClick={handleCardClick}
      aria-label={`Ver detalles de ${formattedData.brandModel}`}
    >
      {/* ===== IMAGEN PRINCIPAL ===== */}
      <div className={`${styles["card__image-container"]} ${!isImageLoaded ? styles["card__image-container--loading"] : ""}`}>
        {offer.hasOffer && (
          <span className={styles.discount_badge} aria-label="Oportunidad de oferta">
            Oportunidad
          </span>
        )}
        <Image
          src={primaryImage}
          alt={altText}
          width={400}
          height={225}
          className={`${styles["card__image"]} ${isImageLoaded ? styles["card__image--loaded"] : ""}`}
          priority={isPriority}
          loading={isPriority ? "eager" : "lazy"}
          quality={isPriority ? 85 : 80}
          sizes="(max-width: 768px) 240px, 320px"
          fetchPriority={isPriority ? "high" : "auto"}
          onLoad={handleImageLoad}
          onError={handleImageLoad}
        />
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className={styles["card__body"]}>
        {/* CONTENEDOR 1: Datos sin logo (más compacto) */}
        <div className={styles.container1}>
          {/* Fila 1: Marca + Modelo */}
          <div className={styles.container1_row1}>
            <span className={styles.marca_text}>{auto.marca}</span>
            <span className={styles.marca_modelo_separator}>|</span>
            <h3 className={styles.modelo_title}>{auto.modelo}</h3>
          </div>

          {/* Fila 2: Versión (siempre debajo de marca/modelo, igual que CardAuto) */}
          {formattedData.version && formattedData.version !== "-" && (
            <div className={styles.container1_row_version}>
              <span className={styles.version_text}>
                {formattedData.version}
              </span>
            </div>
          )}

          {/* Fila 3: Año, Km, Caja */}
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
                    <span className={styles.row2_data_label}>{item.label}</span>
                    <span className={styles.row2_data_value}>{item.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTENEDOR 4: Precio */}
        <div className={styles.container4}>
          <VehiclePrice
            styles={styles}
            offer={offer}
            fallbackPrice={formattedData.price}
          />
        </div>
      </div>
    </Link>
  );
});

CardSimilar.displayName = "CardSimilar";

export default CardSimilar;
