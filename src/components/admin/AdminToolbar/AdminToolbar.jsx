'use client'

import styles from '@/app/admin/dashboard.module.css'

/**
 * Barra de acciones de la sección Usados: alta de vehículo.
 * «Volver al sitio» vive en el header junto a «Cerrar sesión».
 */
export default function AdminToolbar({ onOpenCreate }) {
  return (
    <div className={styles.actionButtons}>
      <button type="button" onClick={onOpenCreate} className={styles.addButton}>
        + Nuevo vehículo
      </button>
    </div>
  )
}
