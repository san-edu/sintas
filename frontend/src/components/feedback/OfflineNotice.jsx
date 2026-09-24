import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded'
import { formatSchoolDateTime } from '../../lib/dateTime'

// State offline: jangan mengklaim data terbaru. Tampilkan waktu cache terakhir
// bila ada, plus aksi Coba lagi (docs/DESIGN_BRIEF.md section 8).
export function OfflineNotice({ updatedAt, onRetry }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-2 rounded-lg border border-black/10 bg-white px-6 py-6 text-center"
    >
      <WifiOffRoundedIcon className="h-8! w-8! text-slate-700" aria-hidden="true" />
      <h3 className="text-base font-bold text-ink-900">Koneksi terputus.</h3>
      <p className="max-w-md text-sm text-slate-700">
        {updatedAt
          ? `Menampilkan data terakhir yang dimuat pada ${formatSchoolDateTime(updatedAt)}.`
          : 'Data belum dapat dimuat.'}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Coba lagi
        </button>
      ) : null}
    </div>
  )
}
