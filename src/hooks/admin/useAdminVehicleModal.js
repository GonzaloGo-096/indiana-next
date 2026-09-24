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
import { ESTADOS, getEstado } from '@/utils/vehicleEstado'

// Los errores de /api/admin llegan de axios con el mensaje del backend en `msg`.
const mensajeDeError = (error) => error?.response?.data?.msg || error?.message || 'error desconocido'

/**
 * Estado y acciones del modal crear/editar vehículo en el panel admin.
 */
export function useAdminVehicleModal({ createMutation, updateMutation, statusMutation, refetch }) {
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
    async (formData, { estado } = {}) => {
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
          dispatch(setLoading())

          // El estado va por una operación aparte del backend y va PRIMERO: el
          // guardado de los datos borra el caché de autos del backend, y así
          // cubre también el cambio de estado (que hoy no lo borra por su
          // cuenta). Si el estado falla, no se guarda nada.
          const cambiaEstado = estado != null && estado !== getEstado(modalState.initialData)
          if (cambiaEstado) {
            try {
              await statusMutation.mutateAsync({ id: vehicleId, estado })
            } catch (error) {
              dispatch(setError(`No se pudo cambiar el estado. No se guardó ningún cambio: ${mensajeDeError(error)}`))
              return
            }
          }

          try {
            await updateMutation.mutateAsync({ id: vehicleId, formData })

            // Refrescar lista y cerrar modal
            refetch()
            dispatch(closeModalAction())
          } catch (error) {
            const prefijo = cambiaEstado
              ? `El auto quedó como "${estado === ESTADOS.VENDIDO ? 'Vendido' : 'Disponible'}", pero no se pudieron guardar los demás cambios`
              : 'No se pudo actualizar el vehículo'
            refetch()
            dispatch(setError(`${prefijo}: ${error.message}`))
          }
        } else {
          dispatch(setError('No se pudo obtener el ID del vehículo para actualizar'))
        }
      }
    },
    [modalState.mode, modalState.initialData, createMutation, updateMutation, statusMutation, refetch]
  )

  return {
    modalState,
    openCreate,
    openEdit,
    closeModal,
    submitFormData,
  }
}
