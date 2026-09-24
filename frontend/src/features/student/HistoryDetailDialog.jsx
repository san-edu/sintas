import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { StatusBadge } from '../../components/common/StatusBadge'
import {
  attendanceStatusLabel,
  attendanceStatusTone,
} from '../../lib/attendanceStatus'
import { formatSchoolDate, formatSchoolDateTime } from '../../lib/dateTime'

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 sm:grid-cols-2">
      <dt className="text-caption text-ink-500">{label}</dt>
      <dd className="text-data text-ink-900">{value ?? '—'}</dd>
    </div>
  )
}

export function HistoryDetailDialog({ item, onClose }) {
  return (
    <Dialog open={Boolean(item)} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-ink-900/50" />
      <div className="fixed inset-0 flex items-end justify-center sm:items-center">
        <DialogPanel className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-radius-lg bg-surface-0 p-6 shadow-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-heading-md font-bold text-ink-900">
                Detail riwayat
              </DialogTitle>
              <p className="mt-0.5 text-body-md text-ink-700">
                Detail tanggal, kelas, dan status absensi.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail"
              className="rounded-radius-sm p-2 text-ink-700 hover:bg-surface-50 focus-visible:outline-school-blue-700"
            >
              <CloseRoundedIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {item ? (
            <dl className="mt-5 space-y-4">
              <DetailRow label="Tanggal sesi" value={formatSchoolDate(item.sessionDate)} />
              <DetailRow label="Mata pelajaran" value={item.subjectName} />
              <DetailRow label="Kelas" value={item.className} />
              <div className="grid grid-cols-[140px_1fr] gap-3 sm:grid-cols-2">
                <dt className="text-caption text-ink-500">Status</dt>
                <dd>
                  <StatusBadge
                    status={item.status}
                    label={attendanceStatusLabel(item.status)}
                    tone={attendanceStatusTone(item.status)}
                  />
                </dd>
              </div>
              <DetailRow
                label="Waktu scan"
                value={
                  item.scannedAt
                    ? formatSchoolDateTime(item.scannedAt)
                    : item.status === 'TIDAK_HADIR'
                      ? 'Tidak tercatat hingga sesi selesai'
                      : null
                }
              />
              <DetailRow
                label="Menit terlambat"
                value={item.status === 'TERLAMBAT' ? `${item.lateMinutes} menit` : null}
              />
              {item.status === 'TIDAK_HADIR' ? (
                <p className="rounded-radius-sm bg-surface-50 p-3 text-body-md text-ink-700">
                  Tidak ada catatan absensi untuk sesi ini hingga sesi berakhir.
                </p>
              ) : null}
            </dl>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  )
}