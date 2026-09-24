import { useQuery } from '@tanstack/react-query'
import {
  attendanceKeys,
  getTeacherSessions,
} from '../../../services/attendanceService'

export function useTeacherSessions() {
  return useQuery({
    queryKey: attendanceKeys.teacherSessions,
    queryFn: getTeacherSessions,
  })
}
