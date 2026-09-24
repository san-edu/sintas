import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, getUsers, resetUserPassword, userKeys } from '../../../services/userService'

export function useAdminUsers(filters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters),
    placeholderData: (previous) => previous,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: userKeys.list() })
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }) => resetUserPassword(id, data),
  })
}