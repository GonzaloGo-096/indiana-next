import { useReducer, useCallback } from 'react'
import { normalizeDetailToFormInitialData, unwrapDetail } from '@/components/admin/mappers/normalizeForForm'
import {
  carModalReducer,
  initialCarModalState,
  openCreateForm,
  openEditForm,
  closeModal as closeModalAction,
  setLoading,
  setError,
} from '@/components/admin/hooks/useCarModal.reducer'
import vehiclesService from '@/lib/services/vehiclesApi'

/**
 * Estado y acciones del modal crear/editar vehículo en el panel admin.
 */
export function useAdminVehicleModal({ createMutation, updateMutation, refetch }) {
  const [modalState, dispatch] = useReducer(carModalReducer, initialCarModalState)

  const openCreate = useCallback(() => {
    dispatch(openCreateForm())
  }, [])

  const openEdit = useCallback(async (vehicle) => {
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

      // El detalle (getonephoto) a veces no devuelve oferta/descuento; el listado (getallphotos) sí.
      // Usar valores del vehículo de la lista como fallback para que el formulario cargue correctamente.
      const listOferta = vehicle.oferta === true || vehicle.oferta === 'true'
      const listDescuento = Math.min(100, Math.max(0, Number(vehicle.descuento) || 0))
      if (listOferta && listDescuento > 0) {
        carData.oferta = true
        carData.descuento = listDescuento
      }

      dispatch(openEditForm(carData))
    } catch (err) {
      dispatch(setError('No se pudo cargar el detalle del vehículo'))
    }
  }, [])

  const closeModal = useCallback(() => {
    dispatch(closeModalAction())
  }, [])

  const submitFormData = useCallback(
    async (formData) => {
      if (modalState.mode === 'create') {
        try {
          dispatch(setLoading())

          await createMutation.mutateAsync(formData)

          // Refrescar lista y cerrar modal
          refetch()
          dispatch(closeModalAction())
        } catch (error) {
          dispatch(setError(`No se pudo crear el vehículo: ${error.message}`))
        }
      } else {
        const vehicleId = modalState.initialData?._id || modalState.initialData?.id
        if (process.env.NODE_ENV === 'development') {
          console.debug('[admin] Update vehicle - ID extraído:', {
            vehicleId,
            initialData: modalState.initialData,
            has_id: !!modalState.initialData?._id,
            has_id_field: !!modalState.initialData?.id,
          })
        }
        if (vehicleId) {
          try {
            dispatch(setLoading())

            await updateMutation.mutateAsync({ id: vehicleId, formData })

            // Refrescar lista y cerrar modal
            refetch()
            dispatch(closeModalAction())
          } catch (error) {
            dispatch(setError(`No se pudo actualizar el vehículo: ${error.message}`))
          }
        } else {
          dispatch(setError('No se pudo obtener el ID del vehículo para actualizar'))
        }
      }
    },
    [modalState.mode, modalState.initialData, createMutation, updateMutation, refetch]
  )

  return {
    modalState,
    openCreate,
    openEdit,
    closeModal,
    submitFormData,
  }
}
