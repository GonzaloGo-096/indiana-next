"use client";

/**
 * UsadosGrid - Grid de vehículos usados
 * 
 * @author Indiana Peugeot
 * @version 1.0.0
 */

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "../../utils/formatters";
import styles from "./usados.module.css";

/**
 * Card de vehículo individual
 * @param {Object} props
 * @param {Object} props.vehicle - Datos del vehículo
 * @param {boolean} props.isPriority - Si es una de las primeras 4-6 cards (LCP)
 */
function VehicleCard({ vehicle, isPriority = false }) {
  const imageUrl = vehicle.fotoPrincipal || vehicle.imagen || "";
  const altText = vehicle.marca && vehicle.modelo
    ? `${vehicle.marca} ${vehicle.modelo}`
    : "Vehículo usado";

  return (
    <Link href={`/usados/${vehicle.id}`} className={styles.vehicleCard}>
      <div className={styles.vehicleCardImage}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={altText}
            width={400}
            height={300}
            className={styles.vehicleImage}
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={80}
          />
        ) : (
          <div className={styles.vehicleImagePlaceholder}>
            Sin imagen
          </div>
        )}
      </div>
      <div className={styles.vehicleCardContent}>
        <h3 className={styles.vehicleTitle}>
          {vehicle.marca} {vehicle.modelo}
        </h3>
        {vehicle.version && (
          <p className={styles.vehicleVersion}>{vehicle.version}</p>
        )}
        <div className={styles.vehicleSpecs}>
          {vehicle.anio && <span>{vehicle.anio}</span>}
          {vehicle.kilometraje && (
            <span>{vehicle.kilometraje.toLocaleString()} km</span>
          )}
          {vehicle.caja && <span>{vehicle.caja}</span>}
        </div>
        {vehicle.precio && (
          <p className={styles.vehiclePrice}>
            {formatPrice(vehicle.precio)}
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * Grid principal
 */
export default function UsadosGrid({
  vehicles = [],
  total = 0,
  currentPage = 1,
  hasNextPage = false,
  onPageChange,
  isLoading = false,
  sort = null,
  onSortChange,
}) {
  if (isLoading && vehicles.length === 0) {
    return (
      <div className={styles.gridLoading}>
        <p>Cargando vehículos...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className={styles.gridEmpty}>
        <p>No se encontraron vehículos.</p>
      </div>
    );
  }

  return (
    <div className={styles.gridSection}>
      {/* Header con total y sorting */}
      <div className={styles.gridHeader}>
        <p className={styles.gridTotal}>
          {total} vehículo{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
        </p>
        {onSortChange && (
          <select
            value={sort || ""}
            onChange={(e) => onSortChange(e.target.value || null)}
            className={styles.sortSelect}
          >
            <option value="">Ordenar por...</option>
            <option value="precio_desc">Precio: Mayor a menor</option>
            <option value="precio_asc">Precio: Menor a mayor</option>
            <option value="km_asc">Kilómetros: Menor a mayor</option>
            <option value="km_desc">Kilómetros: Mayor a menor</option>
          </select>
        )}
      </div>

      {/* Grid de vehículos */}
      <div className={styles.vehiclesGrid}>
        {vehicles.map((vehicle, index) => (
          <VehicleCard 
            key={vehicle.id} 
            vehicle={vehicle}
            isPriority={index < 6}
          />
        ))}
      </div>

      {/* Paginación */}
      {total > 12 && (
        <div className={styles.pagination}>
          {currentPage > 1 && (
            <button
              onClick={() => onPageChange(currentPage - 1)}
              className={styles.paginationButton}
            >
              Anterior
            </button>
          )}
          <span className={styles.paginationInfo}>
            Página {currentPage}
          </span>
          {hasNextPage && (
            <button
              onClick={() => onPageChange(currentPage + 1)}
              className={styles.paginationButton}
            >
              Siguiente
            </button>
          )}
        </div>
      )}
    </div>
  );
}

