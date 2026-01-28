/**
 * Layout del panel administrativo
 * 
 * Incluye QueryClientProvider para React Query
 * 
 * @author Indiana Usados
 * @version 1.0.0
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import styles from './admin.module.css'

export default function AdminLayout({ children }) {
  // Crear QueryClient una sola vez por instancia
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.adminContainer}>
        {children}
      </div>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}



