import { useEffect } from 'react'
import { useSession } from '../../hooks/useSession'
import { useSessionStore } from '../../stores/sessionStore'

export function SessionProvider({ children }) {
  const { data, isPending, isError } = useSession()

  useEffect(() => {
    if (isPending) return
    if (isError) {
      useSessionStore.getState().setUnauthenticated({ expired: false })
      return
    }
    useSessionStore.getState().setUser(data ?? null)
  }, [data, isPending, isError])

  return children
}