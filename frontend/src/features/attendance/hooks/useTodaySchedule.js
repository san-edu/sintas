import { useQuery } from '@tanstack/react-query'
import { attendanceKeys, getTodaySchedule } from '../../../services/attendanceService'

export function useTodaySchedule() {
  return useQuery({
    queryKey: attendanceKeys.today,
    queryFn: getTodaySchedule,
  })
}