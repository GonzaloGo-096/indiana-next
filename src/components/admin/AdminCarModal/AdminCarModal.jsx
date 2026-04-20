'use client'

import CarFormRHF from '@/components/admin/CarForm/CarFormRHF'
import styles from './AdminCarModal.module.css'

const MODE = {
  CREATE: 'create',
  EDIT: 'edit',
}

/**
 * Modal visual crear/editar vehículo (overlay + formulario).
 * La lógica de submit y estado del modal vive en el padre.
 */
export default function AdminCarModal({
  isOpen,
  loading,
  error,
  mode,
  initialData,
  onClose,
  onSubmitFormData,
}) {
  if (!isOpen) return null

  const isCreate = mode === MODE.CREATE
  const title = isCreate ? 'Nuevo vehículo' : 'Editar vehículo'
  const subtitle = isCreate
    ? 'Completá los datos y las fotos obligatorias. Las imágenes se optimizan en el navegador antes de enviar.'
    : 'Modificá los campos necesarios. Las fotos nuevas pasan por el mismo proceso de optimización.'

  return (
    <div
      className={styles.overlay}
      onClick={loading ? undefined : onClose}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-car-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.dialogHeader}>
          <div className={styles.headerMain}>
            <div className={styles.badgeRow}>
              <span className={isCreate ? styles.badgeCreate : styles.badgeEdit}>
                {isCreate ? 'Alta' : 'Edición'}
              </span>
            </div>
            <h1 id="admin-car-modal-title" className={styles.title}>
              {title}
            </h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={styles.closeBtn}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </header>

        {error ? (
          <p className={styles.bannerError} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.bodyScroll}>
          <div className={styles.bodyInner}>
            <CarFormRHF
              mode={mode}
              initialData={initialData}
              onSubmitFormData={onSubmitFormData}
              isLoading={loading}
              onClose={onClose}
              showTitle={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
