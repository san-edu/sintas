import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  attendanceKeys,
  createAttendanceSession,
} from '../../../services/attendanceService'

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAttendanceSession,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.teacherSessions })
    },
  })
}
