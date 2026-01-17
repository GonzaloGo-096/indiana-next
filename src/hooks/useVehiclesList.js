/**
 * useVehiclesList - Hook unificado para listas de vehículos
 * 
 * @author Indiana Usados
 * @version 4.0.0 - Next.js compatible
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import vehiclesService from '@/lib/services/vehiclesApi'
import { mapVehiclesPage } from '@/lib/mappers/vehicleMapper'

export const useVehiclesList = (filters = {}, options = {}) => {
  // PAGE SIZE CONFIGURABLE (default: 8 para página pública)
  const PAGE_SIZE = options.pageSize ?? 8
  
  // QUERY INFINITA - con paginación
  const query = useInfiniteQuery({
    queryKey: ['vehicles', JSON.stringify({ filters, limit: PAGE_SIZE })],
    queryFn: async ({ pageParam, signal }) => {
      const result = await vehiclesService.getVehicles({
        filters, 
        limit: PAGE_SIZE,
        cursor: pageParam,
        signal 
      })
      return result
    },
    initialPageParam: 1,
    
    // Extrae hasNextPage directo del backend
    getNextPageParam: (lastPage) => {
      const hasNext = lastPage?.allPhotos?.hasNextPage
      const next = lastPage?.allPhotos?.nextPage
      return hasNext ? next : undefined
    },
    
    // Usa mapper único
    select: (data) => {
      const pages = data.pages.map(mapVehiclesPage)
      return {
        vehicles: pages.flatMap(p => p.vehicles),
        total: pages[0]?.total ?? 0
      }
    },
    placeholderData: (prev) => prev,
    retry: 2 // 2 reintentos para listas
  })

  // RETORNAR DATOS MAPEADOS
  return {
    vehicles: query.data?.vehicles ?? [],
    total: query.data?.total ?? 0,
    hasNextPage: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  }
}

