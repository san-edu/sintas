import { apiClient } from '../lib/apiClient'

export const userKeys = {
  list: (filters = {}) => (Object.keys(filters).length ? ['users', filters] : ['users']),
}

export async function getUsers({ page = 1, limit = 20, role, search } = {}) {
  const payload = await apiClient.get('/users', {
    params: { page, limit, role, search },
  })
  return payload.data
}

export async function createUser(data) {
  const payload = await apiClient.post('/users', data)
  return payload.data
}

export async function resetUserPassword(id, data) {
  const payload = await apiClient.patch(`/users/${id}/password`, data)
  return payload.data
}