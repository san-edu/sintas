import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded'
import { Link } from 'react-router-dom'
import StatusDot from '../../components/common/StatusDot'

// Ringkasan absensi hari ini, memakai pola kartu golden master
// (border-black/10 + rounded-lg) dan StatusDot untuk status "sudah/belum absen"
// (PLAN_MERGE_UI §3 invariant #6).
export function AttendanceSummary({ items }) {
  const total = items.length
  const scannedCount = items.filter((item) => item.scanned).length
  const remaining = total - scannedCount
  const openSession = items.find(
    (item) => item.windowStatus === 'BISA_ABSEN' && !item.scanned,
  )

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <h2 className="text-lg font-bold text-ink-900">Absensi hari ini</h2>

      {total === 0 ? (
        <div className="mt-3 flex items-start gap-3">
          <EventAvailableRoundedIcon className="mt-0.5 h-5! w-5! shrink-0 text-slate-500" />
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Belum ada sesi hari ini
            </p>
            <p className="mt-0.5 text-sm text-slate-700">
              Jadwal akan muncul 15 menit sebelum jam mulai.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <StatusDot isPresent={scannedCount > 0} />
          <p className="text-3xl font-bold text-blue-500">
            {scannedCount} dari {total} sesi
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <ListAltRoundedIcon className="h-4! w-4! shrink-0 text-slate-500" />
            {remaining > 0
              ? `Belum mengikuti ${remaining} sesi hari ini.`
              : 'Semua absensi hari ini tercatat.'}
          </p>
          {openSession ? (
            <Link
              to={`/app/student/scan?session=${openSession.id}`}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white uppercase"
            >
              Mulai absen
            </Link>
          ) : null}
        </div>
      )}
    </section>
  )
}
