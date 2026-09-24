import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '../../stores/sessionStore'
import { PageLoader } from '../feedback/PageLoader'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const status = useSessionStore((state) => state.status)
  const user = useSessionStore((state) => state.user)

  if (status === 'loading') return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children ?? <Outlet />
}