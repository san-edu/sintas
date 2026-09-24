import { QueryClient } from '@tanstack/react-query'
import { attendanceKeys } from '../services/attendanceService'
import { bannerKeys } from '../services/bannerService'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
})

// Hapus cache ber-scope user/jabatan (jadwal, riwayat, banner, dan data admin
// users/academic/reports dari sesi sebelumnya) saat login/logout agar data
// pengguna lama tidak bocor ke akun berikutnya.
export function clearUserScopedCache(target = queryClient) {
  target.removeQueries({ queryKey: attendanceKeys.today })
  target.removeQueries({ queryKey: attendanceKeys.historyBase })
  target.removeQueries({ queryKey: bannerKeys.active })
  target.removeQueries({ queryKey: ['users'] })
  target.removeQueries({ queryKey: ['banners'] })
  target.removeQueries({ queryKey: ['academic'] })
  target.removeQueries({ queryKey: ['reports'] })
}