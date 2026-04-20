/**
 * Panel admin — Sección Usados: inventario y operaciones sobre vehículos usados.
 */

'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useVehiclesList } from '@/hooks/useVehiclesList'
import { useCarMutation } from '@/hooks/admin/useCarMutation'
import { useAdminVehicleModal } from '@/hooks/admin/useAdminVehicleModal'
import { toAdminListItem } from '@/mappers/admin/toAdminListItem'
import AdminLayout from '@/components/admin/AdminLayout/AdminLayout'
import AdminToolbar from '@/components/admin/AdminToolbar/AdminToolbar'
import AdminInventorySection from '@/components/admin/AdminInventorySection/AdminInventorySection'
import { Alert } from '@/components/ui/Alert/Alert'
import AdminFilters from '@/components/admin/AdminFilters/AdminFilters'
import AdminCarModal from '@/components/admin/AdminCarModal/AdminCarModal'
import RevalidateSection from '@/components/admin/RevalidateSection/RevalidateSection'
import { FILTER_DEFAULTS } from '@/constants/filterOptions'
import styles from '../dashboard.module.css'

export default function AdminUsadosPage() {
  const { logout } = useAuth()

  const [filters, setFilters] = useState({
    marca: [],
    año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max],
  })

  const backendFilters = useCallback(() => filters, [filters])

  const { vehicles, isLoading, error, refetch } = useVehiclesList(backendFilters(), {
    pageSize: 1000,
  })

  const { createMutation, updateMutation, deleteMutation } = useCarMutation()

  const modal = useAdminVehicleModal({ createMutation, updateMutation, refetch })

  const [deleteError, setDeleteError] = useState(null)

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleDeleteVehicle = useCallback(
    async (vehicleId) => {
      try {
        setDeleteError(null)

        const confirmed = window.confirm(
          '¿Está seguro de que desea eliminar este vehículo? Esta acción no se puede deshacer.'
        )
        if (!confirmed) {
          return
        }

        await deleteMutation.mutateAsync(vehicleId)
        refetch()
      } catch (err) {
        setDeleteError(`Error al eliminar: ${err.message}`)
      }
    },
    [deleteMutation, refetch]
  )

  if (isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <header className={styles.sectionScreenHeader}>
          <h2 className={styles.sectionScreenTitle}>Usados</h2>
          <p className={styles.sectionScreenLead}>Inventario y publicaciones del catálogo usados.</p>
        </header>
        <div className={styles.statePanel} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden />
          <p className={styles.stateText}>Cargando vehículos del servidor…</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <header className={styles.sectionScreenHeader}>
          <h2 className={styles.sectionScreenTitle}>Usados</h2>
          <p className={styles.sectionScreenLead}>Inventario y publicaciones del catálogo usados.</p>
        </header>
        <div className={`${styles.statePanel} ${styles.statePanelError}`} role="alert">
          <h3 className={styles.stateTitle}>Error al cargar vehículos</h3>
          <p className={styles.stateMessage}>{error.message || 'Error desconocido'}</p>
          <button type="button" onClick={refetch} className={styles.addButton}>
            Reintentar
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <header className={styles.sectionScreenHeader}>
        <h2 className={styles.sectionScreenTitle}>Usados</h2>
        <p className={styles.sectionScreenLead}>Inventario y publicaciones del catálogo usados.</p>
      </header>

      <AdminToolbar onOpenCreate={modal.openCreate} />

      <AdminFilters onFiltersChange={handleFiltersChange} initialFilters={filters} />

      {deleteError && (
        <div className={styles.alertWrap}>
          <Alert variant="error" dismissible onDismiss={() => setDeleteError(null)}>
            {deleteError}
          </Alert>
        </div>
      )}

      <AdminInventorySection
        items={vehicles.map((vehicle) => toAdminListItem(vehicle))}
        onEdit={modal.openEdit}
        onDelete={handleDeleteVehicle}
      />

      <RevalidateSection />

      <AdminCarModal
        isOpen={modal.modalState.isOpen}
        loading={modal.modalState.loading}
        error={modal.modalState.error}
        mode={modal.modalState.mode}
        initialData={modal.modalState.initialData || {}}
        onClose={modal.closeModal}
        onSubmitFormData={modal.submitFormData}
      />
    </AdminLayout>
  )
}
