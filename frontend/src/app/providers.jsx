import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'
import { AppRoutes } from './router'
import { SessionProvider } from './session/SessionProvider'

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  )
}