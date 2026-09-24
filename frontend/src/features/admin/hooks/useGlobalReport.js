import { useQuery } from '@tanstack/react-query'
import {
  attendanceKeys,
  getGlobalAttendanceReport,
} from '../../../services/attendanceService'

export function useGlobalReport(filters) {
  return useQuery({
    queryKey: attendanceKeys.adminReport(filters),
    queryFn: () => getGlobalAttendanceReport(filters),
    placeholderData: (previous) => previous,
  })
}