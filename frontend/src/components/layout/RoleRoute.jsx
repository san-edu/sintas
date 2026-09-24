import { Outlet } from 'react-router-dom'
import AccessDeniedPage from '../../pages/AccessDeniedPage'
import { hasRole } from '../../lib/permissions'
import { useSessionStore } from '../../stores/sessionStore'

export function RoleRoute({ roles, children }) {
  const user = useSessionStore((state) => state.user)
  if (!hasRole(user, roles)) return <AccessDeniedPage />
  return children ?? <Outlet />
}