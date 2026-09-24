import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Link } from 'react-router-dom'
import {
  attendanceStatusLabel,
  attendanceStatusTone,
} from '../../lib/attendanceStatus'
import { formatSchoolDate, formatSchoolDateTime } from '../../lib/dateTime'
import { StatusBadge } from '../../components/common/StatusBadge'
import { scanErrorPanel } from './scanFlow'

const TONE_ICONS = {
  success: CheckCircleRoundedIcon,
  warning: WarningAmberRoundedIcon,
  danger: ErrorRoundedIcon,
  info: InfoRoundedIcon,
  neutral: CheckCircleRoundedIcon,
}

const TONE_ICON_CLASSES = {
  success: 'text-green-600',
  warning: 'text-orange-600',
  danger: 'text-red-500',
  info: 'text-blue-500',
  neutral: 'text-slate-700',
}

function DetailRow({ label, value }) {
  return value ? (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  ) : null
}

// Satu template hasil scan untuk Hadir, Terlambat, duplicate, dan gagal
// (docs/DESIGN_BRIEF.md section 4.2 S4), mengikuti layout golden master
// `features/scan/ScanResult.tsx`. Semua nilai berasal dari response server.
export function ScanResultPanel({
  result,
  sessionItem,
  isPending = false,
  onRetry,
  onManual,
}) {
  if (result.kind === 'success') {
    const data = result.data
    const isDuplicate = data.duplicate === true
    const label = attendanceStatusLabel(data.status)
    const tone = attendanceStatusTone(data.status)

    return (
      <div
        role="region"
        aria-label="Hasil pemindaian absensi"
        className="mx-auto w-full max-w-md space-y-4"
      >
        <div className="flex flex-col items-center gap-3 rounded-xl border border-black/10 bg-white p-6 text-center">
          <CheckCircleRoundedIcon
            className={`h-16! w-16! ${TONE_ICON_CLASSES[tone]}`}
          />
          <h2 className="text-2xl font-bold text-ink-900">
            {isDuplicate
              ? 'Absensi sudah tercatat'
              : data.status === 'TERLAMBAT'
                ? 'Absensi terlambat'
                : 'Absensi tercatat'}
          </h2>
          <StatusBadge status={data.status} label={label} tone={tone} />
          {isDuplicate ? (
            <p className="text-sm text-slate-700">
              Absensi untuk sesi ini sudah tercatat pada pukul{' '}
              {formatSchoolDateTime(data.scannedAt)}.
            </p>
          ) : (
            <p className="text-sm text-slate-700">
              Absen tercatat pada waktu scan Anda.
            </p>
          )}
          <p className="text-xs text-slate-500">
            Waktu scan: {formatSchoolDateTime(data.scannedAt)}
          </p>
          {data.status === 'TERLAMBAT' && data.lateMinutes > 0 ? (
            <p className="text-sm font-semibold text-orange-700">
              Terlambat {data.lateMinutes} menit
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-4 text-sm">
          <DetailRow label="Mata pelajaran" value={sessionItem?.subjectName} />
          <DetailRow label="Kelas" value={sessionItem?.className} />
          <DetailRow
            label="Tanggal sesi"
            value={sessionItem ? formatSchoolDate(sessionItem.sessionDate) : null}
          />
        </div>

        <Link
          to="/app/student/history"
          className="flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white uppercase"
        >
          Lihat riwayat
        </Link>
        <Link
          to="/app/student"
          className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500"
        >
          Kembali ke beranda
        </Link>
      </div>
    )
  }

  const config = scanErrorPanel(result.error, sessionItem)
  const Icon = TONE_ICONS[config.tone] ?? ErrorRoundedIcon

  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-md space-y-4"
    >
      <div className="flex flex-col items-center gap-3 rounded-xl border border-black/10 bg-white p-6 text-center">
        <Icon className={`h-16! w-16! ${TONE_ICON_CLASSES[config.tone]}`} />
        <h2 className="text-2xl font-bold text-ink-900">{config.title}</h2>
        <p className="text-sm text-slate-700">{config.message}</p>
      </div>

      <div className="flex flex-col gap-2">
        {config.retry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white uppercase disabled:opacity-50"
          >
            {isPending ? 'Memproses…' : 'Coba lagi'}
          </button>
        ) : null}
        {config.manual ? (
          <button
            type="button"
            onClick={onManual}
            disabled={isPending}
            className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500 disabled:opacity-50"
          >
            Masukkan kode manual
          </button>
        ) : null}
        {config.home ? (
          <Link
            to="/app/student"
            className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500"
          >
            Kembali ke beranda
          </Link>
        ) : null}
      </div>
    </div>
  )
}
