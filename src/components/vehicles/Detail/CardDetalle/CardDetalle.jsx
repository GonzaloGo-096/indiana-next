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
import { getVehicleOfferDisplay } from "../../../../utils/vehicleOffer";
import { getBrandLogo } from "../../../../utils/getBrandLogo";
import { getCarouselImages } from "../../../../utils/carouselImages";
import { ImageCarousel } from "../../ImageCarousel/ImageCarousel";
import { GalleryModal } from "../../GalleryModal/GalleryModal";
import { VehiclePrice } from "../../VehiclePrice/VehiclePrice";
import contact from "../../../ui/ContactButtons.module.css";
import WhatsAppLink from "@/components/analytics/WhatsAppLink";
import { SOURCES, LOCATIONS, LEAD_TYPES, VERTICALS } from "@/lib/analytics/events";
import { buildItemParamsFromUsado } from "@/lib/analytics/params";
import styles from "./CardDetalle.module.css";

const WHATSAPP_PHONE = "543816295959";

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

  const offer = useMemo(() => getVehicleOfferDisplay(auto), [auto]);

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
  }, [vehicleData]);

  // Memoizar logo de marca
  const brandLogo = useMemo(() => {
    return getBrandLogo(vehicleData?.marca);
  }, [vehicleData]);

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

  // Datos principales (Año, Km, Caja) — solo los que tienen valor, se acumulan a la izquierda
  const mainData = useMemo(() => {
    if (!vehicleData) return [];
    const items = [
      { label: "Año", value: vehicleData.año },
      { label: "Km", value: formatKilometraje(vehicleData.kms) },
      { label: "Caja", value: vehicleData.caja ? formatCaja(vehicleData.caja) : "" },
    ];
    return items.filter((item) => item.value != null && item.value !== "" && item.value !== "-");
  }, [vehicleData]);

  // Tracción, HP, Cilindrada — solo los que tienen valor, se acumulan a la izquierda
  const versionSpecItems = useMemo(() => {
    if (!vehicleData) return [];
    const traccion = formatValue(vehicleData.traccion);
    const hp = formatHPDisplay(vehicleData.HP);
    const cilindrada = formatCilindradaDisplay(vehicleData.cilindrada);
    const items = [];
    if (traccion && traccion !== "-") items.push({ value: traccion });
    if (hp && hp !== "") items.push({ value: hp });
    if (cilindrada && cilindrada !== "") items.push({ value: cilindrada });
    return items;
  }, [vehicleData]);

  // Información adicional — solo los que tienen valor; los vacíos no se muestran
  const additionalInfo = useMemo(() => {
    if (!vehicleData) return [];
    const items = [
      { label: "Combustible", value: formatValue(vehicleData.combustible) },
      { label: "Tapizado", value: formatValue(vehicleData.tapizado) },
      { label: "Color", value: formatValue(vehicleData.color) },
      { label: "Segmento", value: formatValue(vehicleData.categoria) },
    ];
    return items.filter((item) => item.value != null && item.value !== "" && item.value !== "-");
  }, [vehicleData]);

  // Validación (después de todos los hooks)
  if (!vehicleData) return null;

  return (
    <div className={styles.cardContent} data-testid="vehicle-detail">
      {/* Layout 50/50: Carrusel izquierda, Datos derecha */}
      <div className={styles.mainLayout}>
        {/* SECCIÓN IZQUIERDA: Carrusel sin fondo/card */}
        <div className={styles.carouselSection}>
          <div className={styles.imageCarouselWrapper}>
            {offer.hasOffer && (
              <span className={styles.offerBadge} aria-label="Oportunidad de oferta">
                Oportunidad
              </span>
            )}
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
            <div className={styles.headerBlock}>
              {/* Izquierda: Logo + barra divisoria (altura del logo) */}
              <div className={styles.headerLeft}>
                <div className={styles.logoContainer}>
                  <Image
                    src={brandLogo.src}
                    alt={brandLogo.alt}
                    width={88}
                    height={88}
                    className={`${styles.brand_logo} ${
                      brandLogo.size === "small" ? styles.brand_logo_small : ""
                    } ${brandLogo.size === "large" ? styles.brand_logo_large : ""}`}
                    loading="lazy"
                  />
                </div>
                <span className={styles.titleRowSeparator} aria-hidden="true" />
              </div>
              {/* Derecha: dos filas — marca/modelo arriba; versión + 3 datos (cilindrada, HP, tracción) abajo */}
              <div className={styles.headerRight}>
                <div className={styles.headerRightTop}>
                  {formatValue(vehicleData.marca) !== "-" && (
                    <span className={styles.marca_text}>
                      {formatValue(vehicleData.marca)}
                    </span>
                  )}
                  <h1 className={styles.modelo_title}>{vehicleData.modelo}</h1>
                </div>
                {(formatValue(vehicleData.version) !== "-" || versionSpecItems.length > 0) && (
                  <div className={styles.headerRightBottom}>
                    {formatValue(vehicleData.version) !== "-" && (
                      <span className={styles.version_text}>
                        {formatValue(vehicleData.version)}
                      </span>
                    )}
                    {versionSpecItems.length > 0 && (
                      <>
                        {formatValue(vehicleData.version) !== "-" && (
                          <span className={styles.versionSpec_separator_subtle}>|</span>
                        )}
                        {versionSpecItems.map((item, index) => (
                          <span key={index}>
                            {index > 0 && <span className={styles.versionSpec_separator_subtle}>|</span>}
                            <span className={styles.versionSpec_value}>{item.value}</span>
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTENEDOR: Año, Km, Caja — solo si hay datos, acumulados a la izquierda */}
          {mainData.length > 0 && (
            <div className={styles.mainDataSection}>
              <div className={styles.mainDataRow}>
                {mainData.map((item) => (
                  <div key={item.label} className={styles.mainDataItem}>
                    <div className={styles.mainDataContent}>
                      <span className={styles.mainDataLabel}>{item.label}</span>
                      <span className={styles.mainDataValue}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información adicional — solo ítems con valor; los vacíos no se ven */}
          {additionalInfo.length > 0 && (
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
          )}

          {/* Precio + WhatsApp: mismo ancho (desktop cap), botón centrado bajo precio */}
          <div className={styles.priceColumn}>
            <div className={styles.priceSection}>
              <VehiclePrice
                styles={styles}
                offer={offer}
                fallbackPrice={formatPrice(vehicleData.precio)}
              />
            </div>

            <div className={styles.whatsappSection}>
              <WhatsAppLink
                href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(
                  `Hola! Me interesa el ${vehicleData.marca} ${vehicleData.modelo} ${vehicleData.version || ""} - ${
                    offer.hasOffer ? offer.priceOffer : formatPrice(vehicleData.precio)
                  }`
                )}`}
                phone={WHATSAPP_PHONE}
                source={SOURCES.INLINE}
                location={LOCATIONS.USADOS_DETAIL}
                componentId="whatsapp-card-detalle-usado"
                messageTemplateId="usado_detail"
                leadType={LEAD_TYPES.USED_VEHICLE_INQUIRY}
                vertical={VERTICALS.USADOS}
                item={buildItemParamsFromUsado(auto)}
                className={`${contact.buttonWhatsapp} ${contact.buttonWhatsappFull}`}
                aria-label="Contactar por WhatsApp"
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
                <span>Contactar por WhatsApp</span>
              </WhatsAppLink>
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

