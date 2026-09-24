import { useQuery } from '@tanstack/react-query'
import { authKeys, getMe } from '../services/authService'

export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: getMe,
    retry: false,
  })
}