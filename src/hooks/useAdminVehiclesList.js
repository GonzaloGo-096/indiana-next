/**
 * useAdminVehiclesList - Lista de autos del panel admin.
 *
 * Usa la lista PRIVADA del backend (vía /api/admin): trae también los autos
 * pausados, que la lista pública no devuelve. Sin eso, un auto pausado
 * desaparecería del panel y no habría cómo reactivarlo.
 *
 * El panel pide todo el inventario de una vez (no pagina) y filtra en
 * pantalla; por eso es un pedido simple y no una lista infinita.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import vehiclesAdminService from '@/lib/services/vehiclesAdminService'
import { mapVehiclesPage } from '@/lib/mappers/vehicleMapper'

// Tope de seguridad, muy por encima del inventario real (≈30 autos).
const LIMITE = 1000

export const useAdminVehiclesList = (filters = {}) => {
  // El prefijo ['vehicles'] es el que invalida useCarMutation después de
  // crear, editar, borrar o cambiar un estado.
  const query = useQuery({
    queryKey: ['vehicles', 'admin', JSON.stringify(filters)],
    queryFn: ({ signal }) => vehiclesAdminService.getVehicles({ filters, limit: LIMITE, signal }),
    select: mapVehiclesPage,
    placeholderData: (prev) => prev,
    retry: 2,
  })

  return {
    vehicles: query.data?.vehicles ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
