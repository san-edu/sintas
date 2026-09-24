import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bannerKeys, createBanner, deleteBanner, listManagedBanners, updateBanner } from '../../../services/bannerService'

export function useManagedBanners(filters) {
  return useQuery({
    queryKey: bannerKeys.manage(filters),
    queryFn: () => listManagedBanners(filters),
    placeholderData: (previous) => previous,
  })
}

function useBannerMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: bannerKeys.manage() })
      queryClient.invalidateQueries({ queryKey: bannerKeys.active })
    },
  })
}

export function useCreateBanner() {
  return useBannerMutation(createBanner)
}

export function useUpdateBanner() {
  return useBannerMutation(({ id, data }) => updateBanner(id, data))
}

export function useDeleteBanner() {
  return useBannerMutation(deleteBanner)
}