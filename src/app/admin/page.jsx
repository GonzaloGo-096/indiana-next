/**
 * Dashboard - Panel de administración
 * 
 * @author Indiana Usados
 * @version 7.0.0 - Next.js compatible
 */

'use client'

import { useReducer, useCallback, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useVehiclesList } from '@/hooks/useVehiclesList'
import { useCarMutation } from '@/hooks/admin/useCarMutation'
import { toAdminListItem } from '@/mappers/admin/toAdminListItem'
import { normalizeDetailToFormInitialData, unwrapDetail } from '@/components/admin/mappers/normalizeForForm'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { Alert } from '@/components/ui/Alert/Alert'
import AdminFilters from '@/components/admin/AdminFilters/AdminFilters'
import CarFormRHF from '@/components/admin/CarForm/CarFormRHF'
import RevalidateSection from '@/components/admin/RevalidateSection/RevalidateSection'
import { AUTH_CONFIG } from '@/config/auth'
import { FILTER_DEFAULTS } from '@/constants/filterOptions'
import vehiclesService from '@/lib/services/vehiclesApi'
import { 
  carModalReducer, 
  initialCarModalState, 
  openCreateForm,
  openEditForm,
  closeModal,
  setLoading,
  setError,
  clearError
} from '@/components/admin/hooks/useCarModal.reducer'
import styles from './dashboard.module.css'

// Placeholder para imagen por defecto
const fallbackImage = '/assets/logos/logos-indiana/desktop/logo-chico-solid.webp'

export default function DashboardPage() {
  const router = useRouter()
  const { logout, isAuthenticated } = useAuth()
  
  // Estado de filtros
  const [filters, setFilters] = useState({
    marca: [],
    año: [FILTER_DEFAULTS.AÑO.min, FILTER_DEFAULTS.AÑO.max]
  })
  
  // Construir filtros para el backend
  const backendFilters = useCallback(() => {
    const params = {}
    
    // Filtro de marca
    if (filters.marca && filters.marca.length > 0) {
      params.marca = filters.marca.join(',')
    }
    
    // Filtro de año
    if (filters.año && filters.año.length === 2) {
      const [min, max] = filters.año
      if (min !== FILTER_DEFAULTS.AÑO.min || max !== FILTER_DEFAULTS.AÑO.max) {
        params.anio = `${min},${max}`
      }
    }
    
    return params
  }, [filters])
  
  // Hook para listado de vehículos con filtros
  // ✅ SOLUCIÓN SIMPLE: pageSize muy grande para traer todos los vehículos de una vez
  const { vehicles, isLoading, error, refetch } = useVehiclesList(
    backendFilters(), // filtros aplicados
    { pageSize: 1000 } // pageSize grande para traer todos los vehículos de una sola vez
  )
  
  // ✅ HOOK PARA MUTACIONES DE AUTOS
  const { createMutation, updateMutation, deleteMutation } = useCarMutation()
  
  // Estado del modal con reducer
  const [modalState, dispatch] = useReducer(carModalReducer, initialCarModalState)
  
  // Estado para errores de eliminación (fuera del modal)
  const [deleteError, setDeleteError] = useState(null)
  
  // Handler para cambios de filtros
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, [])

  // Manejadores de autenticación
  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  // Manejadores del modal de autos
  const handleOpenCreateForm = useCallback(() => {
    dispatch(openCreateForm())
  }, [])

  const handleOpenEditForm = useCallback(async (vehicle) => {
    try {
      const id = vehicle._id || vehicle.id
      dispatch(setLoading())

      // GET público por diseño: el endpoint /photos/getonephoto no requiere auth
      const detail = await vehiclesService.getVehicleById(id)

      const unwrapped = unwrapDetail(detail)
      const carData = normalizeDetailToFormInitialData(unwrapped)

      if (!carData || typeof carData !== 'object') {
        dispatch(setError('Respuesta de detalle inválida'))
        return
      }

      dispatch(openEditForm(carData))
    } catch (err) {
      dispatch(setError('No se pudo cargar el detalle del vehículo'))
    }
  }, [])

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal())
  }, [])

  // ✅ MANEJADOR DE CREAR VEHÍCULO
  const handleCreateVehicle = useCallback(async (formData) => {
    try {
      dispatch(setLoading())
      
      await createMutation.mutateAsync(formData)
      
      // Refrescar lista y cerrar modal
      refetch()
      dispatch(closeModal())
    } catch (error) {
      dispatch(setError(`No se pudo crear el vehículo: ${error.message}`))
    }
  }, [createMutation, refetch])

  // ✅ MANEJADOR DE ACTUALIZAR VEHÍCULO
  const handleUpdateVehicle = useCallback(async (formData, vehicleId) => {
    try {
      dispatch(setLoading())
      
      await updateMutation.mutateAsync({ id: vehicleId, formData })
      
      // Refrescar lista y cerrar modal
      refetch()
      dispatch(closeModal())
    } catch (error) {
      dispatch(setError(`No se pudo actualizar el vehículo: ${error.message}`))
    }
  }, [updateMutation, refetch])

  // ✅ MANEJADOR DE ELIMINAR VEHÍCULO
  const handleDeleteVehicle = useCallback(async (vehicleId) => {
    try {
      setDeleteError(null)
      
      const confirmed = window.confirm(
        '¿Está seguro de que desea eliminar este vehículo? Esta acción no se puede deshacer.'
      )
      if (!confirmed) {
        return
      }
      
      await deleteMutation.mutateAsync(vehicleId)
      
      // Refrescar lista
      refetch()
    } catch (error) {
      setDeleteError(`Error al eliminar: ${error.message}`)
    }
  }, [deleteMutation, refetch])

  // Manejador de navegación
  const handleGoBack = useCallback(() => {
    router.push('/')
  }, [router])

  // LOADING STATE
  if (isLoading) {
    return (
      <RequireAuth>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1>Panel de Administración</h1>
              <div className={styles.userInfo}>
                <span>Admin</span>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.content}>
            <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>
              Cargando vehículos del servidor...
            </div>
          </div>
        </div>
      </RequireAuth>
    )
  }

  // ERROR STATE
  if (error) {
    return (
      <RequireAuth>
        <div className={styles.dashboard}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1>Panel de Administración</h1>
              <div className={styles.userInfo}>
                <span>Admin</span>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.content}>
            <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545' }}>
              <h3>Error al cargar vehículos</h3>
              <p>{error.message || 'Error desconocido'}</p>
              <button onClick={refetch} className={styles.addButton}>
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Panel de Administración</h1>
            <div className={styles.userInfo}>
              <span>Admin</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button onClick={handleOpenCreateForm} className={styles.addButton}>
              + Agregar Vehículo
            </button>
            <button onClick={handleGoBack} className={styles.backButton}>
              ← Volver a la Página
            </button>
          </div>
          
          {/* Filtros */}
          <AdminFilters 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
          
          {/* Sección de Publicación / Cache */}
          <RevalidateSection />
          
          {/* Alert de error de eliminación */}
          {deleteError && (
            <div style={{ marginBottom: '20px' }}>
              <Alert 
                variant="error" 
                dismissible 
                onDismiss={() => setDeleteError(null)}
              >
                {deleteError}
              </Alert>
            </div>
          )}

          {/* Vehicles List */}
          <div className={styles.vehiclesList}>
            <h2>Lista de Vehículos ({vehicles.length})</h2>
            
            {vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                No hay vehículos disponibles
              </div>
            ) : (
              vehicles.map((vehicle) => {
                const item = toAdminListItem(vehicle)
                return (
                  <div key={item.id} className={styles.vehicleItem}>
                    <div className={styles.vehicleInfo}>
                      <div className={styles.vehicleImage}>
                        <img 
                          src={item.firstImageUrl}
                          alt={`${item.marca} ${item.modelo}`}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = fallbackImage
                          }}
                        />
                      </div>
                      <div className={styles.vehicleDetails}>
                        <h3>{item.marca} {item.modelo}</h3>
                        <p>Año: {item.anio} | Km: {item.kilometraje.toLocaleString()}</p>
                        <p>Precio: ${item.precio.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className={styles.vehicleActions}>
                      <button 
                        onClick={() => handleOpenEditForm(item._original)} 
                        className={styles.editButton}
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteVehicle(item.id)} 
                        className={styles.deleteButton}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Modal de gestión de autos (placeholder por ahora) */}
        {modalState.isOpen && (
          <div 
            className={styles.modalOverlay} 
            onClick={modalState.loading ? undefined : handleCloseModal}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={handleCloseModal}
                disabled={modalState.loading}
                className={styles.modalCloseButton}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
              
              <div className={styles.modalBody}>
                {modalState.error && (
                  <div className={styles.errorMessage}>
                    {modalState.error}
                  </div>
                )}
                
                <CarFormRHF
                  mode={modalState.mode}
                  initialData={modalState.initialData || {}}
                  onSubmitFormData={(formData) => {
                    if (modalState.mode === 'create') {
                      handleCreateVehicle(formData)
                    } else {
                      const vehicleId = modalState.initialData?._id || modalState.initialData?.id
                      if (vehicleId) {
                        handleUpdateVehicle(formData, vehicleId)
                      }
                    }
                  }}
                  isLoading={modalState.loading}
                  onClose={handleCloseModal}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  )
}

