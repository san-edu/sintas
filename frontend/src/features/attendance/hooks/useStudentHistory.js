import { useQuery } from '@tanstack/react-query'
import { attendanceKeys, getStudentHistory } from '../../../services/attendanceService'

export function useStudentHistory(filters) {
  return useQuery({
    queryKey: attendanceKeys.history(filters),
    queryFn: () => getStudentHistory(filters),
  })
}