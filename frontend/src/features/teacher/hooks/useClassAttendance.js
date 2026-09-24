import { useQuery } from '@tanstack/react-query'
import {
  attendanceKeys,
  getClassAttendance,
} from '../../../services/attendanceService'

export function useClassAttendance(classId, filters) {
  return useQuery({
    queryKey: attendanceKeys.classAttendance(classId, filters),
    queryFn: () => getClassAttendance(classId, filters),
    enabled: Number.isInteger(classId) && classId > 0,
    placeholderData: (previous) => previous,
  })
}
