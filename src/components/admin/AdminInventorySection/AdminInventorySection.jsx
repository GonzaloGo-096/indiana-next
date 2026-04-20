'use client'

import styles from '@/app/admin/dashboard.module.css'

const fallbackImage = '/assets/logos/logos-indiana/desktop/logo-chico-solid.webp'

/**
 * Inventario del panel: encabezado, contador, vacío y tarjetas con editar / eliminar.
 * `items` debe ser la lista ya mapeada con toAdminListItem (incluye _original para editar).
 */
export default function AdminInventorySection({ items, onEdit, onDelete }) {
  const count = items.length

  return (
    <section className={styles.vehiclesList} aria-labelledby="admin-inventory-heading">
      <div className={styles.listIntro}>
        <h2 id="admin-inventory-heading" className={styles.listTitle}>
          Inventario
        </h2>
        <p className={styles.listHint}>
          {count === 0
            ? 'No hay resultados con los filtros actuales.'
            : 'Cada fila resume el estado publicado del vehículo.'}
        </p>
        <span className={styles.countPill}>{count} unidades</span>
      </div>

      {count === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Sin vehículos para mostrar</p>
          <p className={styles.emptyText}>
            Probá ampliar el rango de años o las marcas en los filtros de arriba.
          </p>
        </div>
      ) : (
        <ul className={styles.vehicleCardList}>
          {items.map((item) => (
            <li key={item.id}>
              <article className={styles.vehicleCard}>
                <div className={styles.vehicleCardMedia}>
                  <img
                    src={item.firstImageUrl}
                    alt={`${item.marca} ${item.modelo}`}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = fallbackImage
                    }}
                  />
                </div>
                <div className={styles.vehicleCardBody}>
                  <h3 className={styles.vehicleTitle}>
                    {item.marca} <span className={styles.vehicleModel}>{item.modelo}</span>
                  </h3>
                  <dl className={styles.metaList}>
                    <div className={styles.metaItem}>
                      <dt>Año</dt>
                      <dd>{item.anio}</dd>
                    </div>
                    <div className={styles.metaItem}>
                      <dt>Km</dt>
                      <dd>{item.kilometraje.toLocaleString('es-AR')}</dd>
                    </div>
                    <div className={styles.metaItem}>
                      <dt>Oferta</dt>
                      <dd>
                        <span className={item.oferta ? styles.offerYes : styles.offerNo}>
                          {item.oferta ? `${item.descuento}%` : '—'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className={styles.vehicleCardAside}>
                  <div className={styles.priceBox} aria-label="Precio">
                    {item.oferta && item.precioOferta != null ? (
                      <>
                        <span className={styles.priceList}>Lista ${item.precio.toLocaleString('es-AR')}</span>
                        <span className={styles.priceMain}>${item.precioOferta.toLocaleString('es-AR')}</span>
                        <span className={styles.priceTag}>Oferta</span>
                      </>
                    ) : (
                      <span className={styles.priceMain}>${item.precio.toLocaleString('es-AR')}</span>
                    )}
                  </div>
                  <div className={styles.vehicleActions}>
                    <button
                      type="button"
                      onClick={() => onEdit(item._original)}
                      className={styles.editButton}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className={styles.deleteButton}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
