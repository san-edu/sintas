import { useQuery } from '@tanstack/react-query'
import { bannerKeys, getActiveBanners } from '../../../services/bannerService'

export function useActiveBanners() {
  return useQuery({
    queryKey: bannerKeys.active,
    queryFn: getActiveBanners,
  })
}