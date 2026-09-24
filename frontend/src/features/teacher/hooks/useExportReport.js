import { useMutation } from '@tanstack/react-query'
import { downloadBlob, filenameFromDisposition } from '../../../lib/download'
import { exportAttendanceReport } from '../../../services/attendanceService'

export function useExportReport() {
  return useMutation({
    mutationFn: async (params) => {
      const response = await exportAttendanceReport(params)
      const filename = filenameFromDisposition(
        response.headers?.['content-disposition'],
      )
      downloadBlob(response.data, filename)
      return filename
    },
  })
}
