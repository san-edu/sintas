import { apiClient } from '../lib/apiClient'

export const authKeys = {
  session: ['auth', 'session'],
}

export async function login({ username, password }) {
  const payload = await apiClient.post('/auth/login', { username, password })
  return payload.data.user
}

export async function logout() {
  await apiClient.post('/auth/logout')
}

export async function forgotPassword(payload) {
  await apiClient.post('/auth/forgot-password', payload)
}

export async function getMe() {
  const payload = await apiClient.get('/me')
  return payload.data.user
}

export async function updateMe(payload) {
  const body = await apiClient.patch('/me', payload)
  return body.data.user
}