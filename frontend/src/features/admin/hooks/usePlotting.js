import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  academicKeys,
  createAssignment,
  createMembership,
  getAssignmentsManage,
  getMemberships,
  updateAssignment,
  updateMembership,
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

function usePlottingMutation(mutationFn, keyFactory) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: keyFactory() })
    },
  })
}

export function useCreateMembership() {
  return usePlottingMutation(createMembership, academicKeys.memberships)
}

export function useUpdateMembership() {
  return usePlottingMutation(({ id, data }) => updateMembership(id, data), academicKeys.memberships)
}

export function useCreateAssignment() {
  return usePlottingMutation(createAssignment, academicKeys.assignmentsManage)
}

export function useUpdateAssignment() {
  return usePlottingMutation(({ id, data }) => updateAssignment(id, data), academicKeys.assignmentsManage)
}
