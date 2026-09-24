import { useQuery } from '@tanstack/react-query'
import {
  academicKeys,
  getTeacherAssignments,
} from '../../../services/academicService'

export function useTeacherAssignments() {
  return useQuery({
    queryKey: academicKeys.assignments,
    queryFn: getTeacherAssignments,
  })
}
