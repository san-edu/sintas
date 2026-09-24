import { apiClient } from '../lib/apiClient'

export const bannerKeys = {
  active: ['banners', 'active'],
  manage: (filters = {}) => (Object.keys(filters).length ? ['banners', 'manage', filters] : ['banners', 'manage']),
}

export async function getActiveBanners() {
  const payload = await apiClient.get('/banners')
  return payload.data
}

export async function listManagedBanners({ page = 1, limit = 20, isActive, search } = {}) {
  const payload = await apiClient.get('/banners/manage', {
    params: { page, limit, isActive, search },
  })
  return payload.data
}

export async function createBanner(data) {
  const payload = await apiClient.post('/banners', data)
  return payload.data
}

export async function updateBanner(id, data) {
  const payload = await apiClient.patch(`/banners/${id}`, data)
  return payload.data
}

export async function deleteBanner(id) {
  const payload = await apiClient.delete(`/banners/${id}`)
  return payload.data
}