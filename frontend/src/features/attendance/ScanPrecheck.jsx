import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import PrimaryButton from '../../components/common/PrimaryButton'
import { StatusBadge } from '../../components/common/StatusBadge'
import {
  windowStatusLabel,
  windowStatusTone,
} from '../../lib/attendanceStatus'
import { formatSchoolDate, formatSchoolTime } from '../../lib/dateTime'

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  )
}

// Pre-check sebelum kamera diminta (docs/DESIGN_BRIEF.md 4.2): detail sesi,
// jendela absensi, dan CTA memulai scan. Layout mengikuti golden master
// `features/scan/Scan.tsx`; status window tetap dari server.
export function ScanPrecheck({ sessionItem, missed = false, onBegin, onManual }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      {sessionItem ? (
        <div className="flex flex-col gap-2 rounded-lg border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="truncate text-xl font-semibold text-ink-900">
              {sessionItem.subjectName}
            </h2>
            <StatusBadge
              status={sessionItem.windowStatus}
              label={windowStatusLabel(sessionItem.windowStatus)}
              tone={windowStatusTone(sessionItem.windowStatus)}
            />
          </div>
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-ink-900">
              {sessionItem.className}
            </span>
          </p>
          <span className="flex items-center gap-1 text-sm text-slate-700">
            <ScheduleRoundedIcon className="h-4! w-4!" />
            {formatSchoolDate(sessionItem.sessionDate)} ·{' '}
            {formatSchoolTime(sessionItem.startAt)}–
            {formatSchoolTime(sessionItem.endAt)}
          </span>

          <div className="mt-2 flex flex-col gap-2 border-t border-black/10 pt-3">
            <DetailRow label="Mata pelajaran" value={sessionItem.subjectName} />
            <DetailRow label="Guru" value={sessionItem.teacherName} />
            <DetailRow
              label="Jendela absensi"
              value={`${formatSchoolTime(sessionItem.startAt)}–${formatSchoolTime(sessionItem.endAt)}`}
            />
          </div>

          {sessionItem.windowStatus === 'BELUM_DIBUKA' ? (
            <p className="text-sm text-slate-700">
              Sesi belum dibuka. Scan dapat dilakukan setelah pukul{' '}
              {formatSchoolTime(sessionItem.startAt)}.
            </p>
          ) : null}
          {sessionItem.windowStatus === 'SELESAI' ? (
            <p className="text-sm text-slate-700">
              Sesi sudah selesai. Scan telat tidak mencatat kehadiran.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-black/10 bg-white p-6 text-center">
          {missed ? (
            <p className="w-full rounded-lg bg-black/5 p-3 text-sm text-slate-700">
              Sesi ini tidak ada pada jadwal hari ini. Anda tetap dapat
              memindai; status ditentukan server.
            </p>
          ) : null}
          <div className="rounded-lg bg-black/5 p-3">
            <QrCode2RoundedIcon className="h-24! w-24! text-slate-800" />
          </div>
          <h2 className="text-xl font-semibold text-ink-900">
            Arahkan kamera ke QR Code
          </h2>
          <p className="text-sm text-slate-700">
            Temukan QR Code yang ditampilkan guru, lalu arahkan kamera ke kode
            tersebut.
          </p>
        </div>
      )}

      <p className="text-center text-sm text-slate-700">
        Scan hanya aktif dari 15 menit sebelum mulai sampai jam selesai. Status
        dan keterlambatan dihitung server.
      </p>

      <PrimaryButton
        type="button"
        onClick={onBegin}
        className="uppercase"
      >
        Mulai memindai
      </PrimaryButton>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-slate-700">atau kode manual</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <button
        type="button"
        onClick={onManual}
        className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500"
      >
        Masukkan kode manual
      </button>
    </div>
  )
}
