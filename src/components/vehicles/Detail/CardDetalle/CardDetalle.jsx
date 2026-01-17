"use client";

/**
 * CardDetalle - Rediseño completo moderno, elegante y minimalista
 * 
 * Layout 50/50 simétrico:
 * - Izquierda: Carrusel fijo sin fondo/card
 * - Derecha: Datos sin fondo/card
 * 
 * Jerarquía visual:
 * 1. Título/Modelo (más importante)
 * 2. Año, Km, Caja (segunda importancia)
 * 3. Cilindrada, HP, Tracción (menos importante)
 * 
 * @author Indiana Peugeot
 * @version 6.0.0 - Next.js migrado
 */

import { memo, useMemo, useCallback, useState } from "react";
import Image from "next/image";
import {
  formatValue,
  formatCaja,
  formatPrice,
  formatKilometraje,
  formatCilindradaDisplay,
  formatHPDisplay,
} from "../../../../utils/formatters";
import { getBrandLogo } from "../../../../utils/getBrandLogo";
import { getCarouselImages } from "../../../../utils/carouselImages";
import { ImageCarousel } from "../../ImageCarousel/ImageCarousel";
import { GalleryModal } from "../../GalleryModal/GalleryModal";
import { AnioIcon } from "../../../ui/icons/AnioIcon";
import { KmIcon } from "../../../ui/icons/KmIcon";
import { CajaIconDetalle } from "../../../ui/icons/CajaIconDetalle";
import styles from "./CardDetalle.module.css";

/**
 * Componente CardDetalle rediseñado
 */
export const CardDetalle = memo(({ auto, contactInfo }) => {
  // Obtener imágenes del carrusel
  const carouselImages = useMemo(() => {
    if (!auto) return [];
    return getCarouselImages(auto);
  }, [auto]);

  // Estado del modal de galería
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Memoización de datos del vehículo
  const vehicleData = useMemo(() => {
    if (!auto) return null;

    return {
      marca: auto.marca || "",
      modelo: auto.modelo || "",
      version: auto.version || "",
      cilindrada: auto.cilindrada || "",
      precio: auto.precio || "",
      año: auto.anio || auto.año || "",
      kms: auto.kilometraje || auto.kms || "",
      caja: formatCaja(auto.caja),
      color: auto.color || "",
      categoria: auto.segmento || auto.categoria || "",
      combustible: auto.combustible || "",
      traccion: auto.traccion || "",
      tapizado: auto.tapizado || "",
      HP: auto.HP || "",
    };
  }, [auto]);

  // Memoización del alt text
  const altText = useMemo(() => {
    if (!vehicleData?.marca || !vehicleData?.modelo) return "Vehículo";
    return `${formatValue(vehicleData.marca)} ${formatValue(vehicleData.modelo)}`;
  }, [vehicleData?.marca, vehicleData?.modelo]);

  // Memoizar logo de marca
  const brandLogo = useMemo(() => {
    return getBrandLogo(vehicleData?.marca);
  }, [vehicleData?.marca]);

  // Transformar imágenes al formato que espera GalleryModal
  const galleryImages = useMemo(() => {
    if (!carouselImages || carouselImages.length === 0) return [];
    return carouselImages.map((img, index) => {
      const url = typeof img === "string" ? img : img?.url || "";
      return {
        url,
        alt: `${altText} - Imagen ${index + 1}`,
      };
    }).filter((img) => img.url && img.url.trim() !== "");
  }, [carouselImages, altText]);

  // Handlers del modal
  const handleImageClick = useCallback(
    (index = 0) => {
      setActiveIndex(index);
      setIsModalOpen(true);
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleIndexChange = useCallback((newIndex) => {
    setActiveIndex(newIndex);
  }, []);

  // Validación
  if (!vehicleData) return null;

  // Datos principales memoizados (Año, Km, Caja) - Segunda importancia
  const mainData = useMemo(
    () => [
      { label: "Año", value: vehicleData.año, icon: AnioIcon },
      { label: "Km", value: formatKilometraje(vehicleData.kms), icon: KmIcon },
      { label: "Caja", value: formatCaja(vehicleData.caja), icon: CajaIconDetalle },
    ],
    [vehicleData.año, vehicleData.kms, vehicleData.caja]
  );

  // Información adicional memoizada
  const additionalInfo = useMemo(
    () => [
      { label: "Combustible", value: formatValue(vehicleData.combustible) },
      { label: "Tapizado", value: formatValue(vehicleData.tapizado) },
      { label: "Color", value: formatValue(vehicleData.color) },
      { label: "Segmento", value: formatValue(vehicleData.categoria) },
    ],
    [vehicleData]
  );

  return (
    <div className={styles.cardContent} data-testid="vehicle-detail">
      {/* Layout 50/50: Carrusel izquierda, Datos derecha */}
      <div className={styles.mainLayout}>
        {/* SECCIÓN IZQUIERDA: Carrusel sin fondo/card */}
        <div className={styles.carouselSection}>
          <div className={styles.imageCarouselWrapper}>
            <ImageCarousel
              images={carouselImages}
              altText={altText}
              showArrows={true}
              autoPlay={false}
              onMainImageClick={handleImageClick}
            />
          </div>
        </div>

        {/* SECCIÓN DERECHA: Datos sin fondo/card */}
        <div className={styles.dataSection}>
          {/* CONTENEDOR 1: Título + Specs */}
          <div className={styles.headerSection}>
            {/* Datos izquierda */}
            <div className={styles.headerData}>
              {/* Fila 1: Marca + Modelo + Versión (si caben, en una línea; si no, bajan completos) */}
              <div className={styles.titleRow}>
                {formatValue(vehicleData.marca) !== "-" && (
                  <span className={styles.marca_text}>
                    {formatValue(vehicleData.marca)}
                  </span>
                )}
                <h1 className={styles.modelo_title}>{vehicleData.modelo}</h1>
                <span className={styles.version_text}>
                  {formatValue(vehicleData.version)}
                </span>
              </div>

              {/* Fila 1.5: Tracción + HP + Cilindrada */}
              <div className={styles.versionSection}>
                <span className={styles.versionSpec_value}>
                  {formatValue(vehicleData.traccion) !== "-"
                    ? formatValue(vehicleData.traccion)
                    : "-"}
                </span>
                <span className={styles.versionSpec_separator_subtle}>|</span>
                <span className={styles.versionSpec_value}>
                  {formatHPDisplay(vehicleData.HP) || "-"}
                </span>
                <span className={styles.versionSpec_separator_subtle}>|</span>
                <span className={styles.versionSpec_value}>
                  {formatCilindradaDisplay(vehicleData.cilindrada) || "-"}
                </span>
              </div>
            </div>

            {/* Logo a la derecha */}
            <div className={styles.logoContainer}>
              <Image
                src={brandLogo.src}
                alt={brandLogo.alt}
                width={140}
                height={140}
                className={`${styles.brand_logo} ${
                  brandLogo.size === "small" ? styles.brand_logo_small : ""
                } ${brandLogo.size === "large" ? styles.brand_logo_large : ""}`}
                loading="lazy"
              />
            </div>
          </div>

          {/* CONTENEDOR 3: Año, Km, Caja (SEGUNDA IMPORTANCIA) */}
          <div className={styles.mainDataSection}>
            {/* Fila 2: Año, Km, Caja (SEGUNDA IMPORTANCIA) */}
            <div className={styles.mainDataRow}>
              {mainData.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.label} className={styles.mainDataItem}>
                    <div className={styles.mainDataContent}>
                      <div className={styles.mainDataLabelGroup}>
                        <div className={styles.mainDataIcon}>
                          <IconComponent size={16} color="currentColor" />
                        </div>
                        <span className={styles.mainDataLabel}>{item.label}</span>
                      </div>
                      <span className={styles.mainDataValue}>{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONTENEDOR 2: Información adicional (grid) */}
          <div className={styles.additionalInfoSection}>
            <div className={styles.infoContainer}>
              {additionalInfo.map((item) => (
                <div key={item.label} className={styles.infoItem}>
                  <span className={styles.infoKey}>{item.label}</span>
                  <span className={styles.infoValue}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONTENEDOR 3: Precio (antes del contacto) - Estilo CardAuto */}
          <div className={styles.priceSection}>
            {/* Contenedor izquierda: "Desde:" */}
            <div className={styles.price_label_container}>
              <span className={styles.price_label}>desde:</span>
            </div>

            {/* Contenedor derecha: Precio alineado a la derecha */}
            <div className={styles.price_display}>
              <span className={styles.price_value}>
                {formatPrice(vehicleData.precio)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de galería */}
      {galleryImages.length > 0 && (
        <GalleryModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          images={galleryImages}
          activeIndex={activeIndex}
          onIndexChange={handleIndexChange}
          modelName={altText}
        />
      )}
    </div>
  );
});

CardDetalle.displayName = "CardDetalle";

export default CardDetalle;

