import { useQuery } from '@tanstack/react-query'
import {
  attendanceKeys,
  getSessionQr,
} from '../../../services/attendanceService'

export function useSessionQr(id) {
  return useQuery({
    queryKey: attendanceKeys.sessionQr(id),
    queryFn: () => getSessionQr(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}
