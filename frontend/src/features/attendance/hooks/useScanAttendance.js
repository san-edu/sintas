import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  attendanceKeys,
  scanAttendance,
} from '../../../services/attendanceService'

// Mutation scan tunggal (frontend/GUIDE.md section 6): retry cepat dinonaktifkan
// selama request; setelah sukses, jadwal/riwayat disegarkan via invalidate —
// tidak ada state duplicate yang dibangun di client.
export function useScanAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: attendanceKeys.scan,
    mutationFn: (qrPayload) => scanAttendance(qrPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today })
      queryClient.invalidateQueries({ queryKey: attendanceKeys.historyBase })
    },
  })
}