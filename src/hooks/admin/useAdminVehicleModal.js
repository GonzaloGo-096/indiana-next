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
import { normalizeDiscount } from '@/lib/pricing/discount'

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

      // El detalle (getonephoto) a veces no devuelve el descuento; el listado (getallphotos) sí.
      // Fallback: si el detalle vino sin descuento, usar el del vehículo de la lista.
      if ((!carData.descuentoValor || carData.descuentoValor === 0) && vehicle.descuento != null) {
        const disc = normalizeDiscount(vehicle.descuento, vehicle.oferta)
        if (disc.valor > 0) {
          carData.descuentoTipo = disc.tipo
          carData.descuentoValor = disc.valor
        }
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
