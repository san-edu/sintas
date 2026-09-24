import { useQuery } from '@tanstack/react-query'
import {
  academicKeys,
  getAssignmentsManage,
  getMemberships,
} from '../../../services/academicService'

export function useMemberships(filters = {}) {
  return useQuery({
    queryKey: academicKeys.memberships(filters),
    queryFn: () => getMemberships(filters),
    placeholderData: (previous) => previous,
  })
}

export function useAssignmentsManage(filters = {}) {
  return useQuery({
    queryKey: academicKeys.assignmentsManage(filters),
    queryFn: () => getAssignmentsManage(filters),
    placeholderData: (previous) => previous,
  })
}