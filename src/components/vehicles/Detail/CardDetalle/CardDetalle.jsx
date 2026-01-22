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

          {/* CONTENEDOR 4: Botón de WhatsApp */}
          <div className={styles.whatsappSection}>
            <a
              href={`https://wa.me/543816295959?text=${encodeURIComponent(
                `Hola! Me interesa el ${vehicleData.marca} ${vehicleData.modelo} ${vehicleData.version || ""} - ${formatPrice(vehicleData.precio)}`
              )}`}
              className={styles.whatsappButton}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp"
            >
              <svg
                className={styles.whatsappIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Contactar por WhatsApp</span>
            </a>
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

