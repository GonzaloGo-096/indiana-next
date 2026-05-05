'use client'

import { useCallback, useId, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useVehiclesList } from '@/hooks/useVehiclesList'
import { useCarMutation } from '@/hooks/admin/useCarMutation'
import { useAdminVehicleModal } from '@/hooks/admin/useAdminVehicleModal'
import { toAdminListItem } from '@/mappers/admin/toAdminListItem'
import AdminLayout from '@/components/admin/AdminLayout/AdminLayout'
import AdminInventorySection from '@/components/admin/AdminInventorySection/AdminInventorySection'
import { Alert } from '@/components/ui/Alert/Alert'
import AdminFilters from '@/components/admin/AdminFilters/AdminFilters'
import AdminCarModal from '@/components/admin/AdminCarModal/AdminCarModal'
import RevalidateSection from '@/components/admin/RevalidateSection/RevalidateSection'
import { FILTER_BOUNDS } from '@/constants/filterOptions'
import styles from '../dashboard.module.css'

const USADOS_TAB = {
  INVENTARIO: 'inventario',
  METRICAS: 'metricas',
}

function UsadosMetricasPlaceholder({ id, role, 'aria-labelledby': ariaLabelledBy, className }) {
  return (
    <div id={id} role={role} aria-labelledby={ariaLabelledBy} className={className}>
      <div className={styles.sectionPlaceholder}>
        <h3 className={styles.sectionPlaceholderTitle}>Métricas</h3>
        <p className={styles.sectionPlaceholderText}>
          Aquí podrás ver indicadores del inventario. Próximamente.
        </p>
      </div>
    </div>
  )
}

export default function AdminUsadosPage() {
  const { logout } = useAuth()
  const tabId = useId()
  const inventarioTabId = `${tabId}-inventario-tab`
  const metricasTabId = `${tabId}-metricas-tab`
  const inventarioPanelId = `${tabId}-inventario-panel`
  const metricasPanelId = `${tabId}-metricas-panel`

  const [usadosTab, setUsadosTab] = useState(USADOS_TAB.INVENTARIO)

  const [filters, setFilters] = useState({
    marca: [],
    año: [FILTER_BOUNDS.AÑO.min, FILTER_BOUNDS.AÑO.max],
  })

  // Key para forzar remount de AdminFilters (que mantiene su propio estado interno)
  // cuando reseteamos desde el empty state.
  const [filtersResetKey, setFiltersResetKey] = useState(0)

  const backendFilters = useCallback(() => filters, [filters])

  // ✅ Admin ve TODO el inventario: sin defaults invisibles de precio/km.
  // (mergeDefaults: false ya es el default global; lo dejamos explícito por claridad).
  const { vehicles, isLoading, error, refetch } = useVehiclesList(backendFilters(), {
    pageSize: 1000,
    mergeDefaults: false,
  })

  const hasActiveFilters = useMemo(() => {
    const [a, b] = filters.año
    return (
      filters.marca.length > 0 ||
      a !== FILTER_BOUNDS.AÑO.min ||
      b !== FILTER_BOUNDS.AÑO.max
    )
  }, [filters])

  const handleResetFilters = useCallback(() => {
    setFilters({
      marca: [],
      año: [FILTER_BOUNDS.AÑO.min, FILTER_BOUNDS.AÑO.max],
    })
    setFiltersResetKey((k) => k + 1)
  }, [])

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

  const usadosTabs = (
    <div className={styles.usadosTabs} role="tablist" aria-label="Secciones de Usados">
      <button
        type="button"
        id={inventarioTabId}
        role="tab"
        aria-selected={usadosTab === USADOS_TAB.INVENTARIO}
        aria-controls={inventarioPanelId}
        className={`${styles.usadosTab} ${usadosTab === USADOS_TAB.INVENTARIO ? styles.usadosTabActive : ''}`}
        onClick={() => setUsadosTab(USADOS_TAB.INVENTARIO)}
      >
        Inventario
      </button>
      <button
        type="button"
        id={metricasTabId}
        role="tab"
        aria-selected={usadosTab === USADOS_TAB.METRICAS}
        aria-controls={metricasPanelId}
        className={`${styles.usadosTab} ${usadosTab === USADOS_TAB.METRICAS ? styles.usadosTabActive : ''}`}
        onClick={() => setUsadosTab(USADOS_TAB.METRICAS)}
      >
        Métricas
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className={styles.usadosShell}>
          {usadosTabs}
          {usadosTab === USADOS_TAB.INVENTARIO ? (
            <div
              id={inventarioPanelId}
              role="tabpanel"
              aria-labelledby={inventarioTabId}
              className={styles.usadosTabPanel}
            >
              <div className={styles.usadosPageIntro}>
                <div className={styles.statePanel} role="status" aria-live="polite">
                  <span className={styles.spinner} aria-hidden />
                  <p className={styles.stateText}>Cargando vehículos del servidor…</p>
                </div>
              </div>
            </div>
          ) : (
            <UsadosMetricasPlaceholder
              id={metricasPanelId}
              role="tabpanel"
              aria-labelledby={metricasTabId}
              className={styles.usadosTabPanel}
            />
          )}
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className={styles.usadosShell}>
          {usadosTabs}
          {usadosTab === USADOS_TAB.INVENTARIO ? (
            <div
              id={inventarioPanelId}
              role="tabpanel"
              aria-labelledby={inventarioTabId}
              className={styles.usadosTabPanel}
            >
              <div className={styles.usadosPageIntro}>
                <div className={`${styles.statePanel} ${styles.statePanelError}`} role="alert">
                  <h3 className={styles.stateTitle}>Error al cargar vehículos</h3>
                  <p className={styles.stateMessage}>{error.message || 'Error desconocido'}</p>
                  <button type="button" onClick={refetch} className={styles.addButton}>
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <UsadosMetricasPlaceholder
              id={metricasPanelId}
              role="tabpanel"
              aria-labelledby={metricasTabId}
              className={styles.usadosTabPanel}
            />
          )}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className={styles.usadosShell}>
        {usadosTabs}
        {usadosTab === USADOS_TAB.INVENTARIO ? (
          <div
            id={inventarioPanelId}
            role="tabpanel"
            aria-labelledby={inventarioTabId}
            className={styles.usadosTabPanel}
          >
            <div className={styles.usadosPageIntro}>
              <AdminFilters
                key={filtersResetKey}
                onFiltersChange={handleFiltersChange}
                initialFilters={filters}
              />

              {deleteError && (
                <div className={styles.alertWrap}>
                  <Alert variant="error" dismissible onDismiss={() => setDeleteError(null)}>
                    {deleteError}
                  </Alert>
                </div>
              )}
            </div>

            <AdminInventorySection
              items={vehicles.map((vehicle) => toAdminListItem(vehicle))}
              onEdit={modal.openEdit}
              onDelete={handleDeleteVehicle}
              onOpenCreate={modal.openCreate}
              addDisabled={createMutation.isPending}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            />

            <RevalidateSection />
          </div>
        ) : (
          <UsadosMetricasPlaceholder
            id={metricasPanelId}
            role="tabpanel"
            aria-labelledby={metricasTabId}
            className={styles.usadosTabPanel}
          />
        )}
      </div>

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
