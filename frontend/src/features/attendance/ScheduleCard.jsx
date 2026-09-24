import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Skeleton } from '../../components/common/Skeleton'
import {
  attendanceStatusLabel,
  attendanceStatusTone,
  windowStatusLabel,
  windowStatusTone,
} from '../../lib/attendanceStatus'
import { formatSchoolTime } from '../../lib/dateTime'

function durationMinutes(startAt, endAt) {
  const minutes = Math.round((new Date(endAt) - new Date(startAt)) / 60_000)
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null
}

// Kartu jadwal mengikuti golden master JadwalCard (PLAN_MERGE_UI §3 invariant
// #7): ikon mapel dalam kotak biru, waktu & durasi di kanan, pill status, aksi
// `Absen sekarang` hanya saat jendela terbuka. Status tetap dari server.
export function ScheduleCard({ item }) {
  const start = formatSchoolTime(item.startAt)
  const duration = durationMinutes(item.startAt, item.endAt)
  const attendanceLabel = attendanceStatusLabel(item.attendanceStatus)
  const canScan = item.windowStatus === 'BISA_ABSEN' && !item.scanned

  return (
    <article
      aria-label={`${item.subjectName}, ${item.startAt}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4"
    >
      <div className="flex min-w-0 items-center">
        <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500">
          <MenuBookRoundedIcon className="h-6! w-6!" />
        </div>

        <div className="mr-4 flex min-w-0 flex-col">
          <span className="truncate text-xl font-semibold text-ink-900">
            {item.subjectName}
          </span>
          <span className="truncate text-sm text-slate-700">
            {item.className}
            {item.teacherName ? ` · ${item.teacherName}` : ''}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex flex-col items-end">
          <span className="font-semibold text-ink-900">{start}</span>
          {duration ? (
            <span className="text-sm text-slate-700">{duration}min</span>
          ) : null}
        </div>

        <StatusBadge
          status={item.windowStatus}
          label={windowStatusLabel(item.windowStatus)}
          tone={windowStatusTone(item.windowStatus)}
        />
        {attendanceLabel ? (
          <StatusBadge
            status={item.attendanceStatus}
            label={attendanceLabel}
            tone={attendanceStatusTone(item.attendanceStatus)}
          />
        ) : null}

        {canScan ? (
          <Link
            to={`/app/student/scan?session=${item.id}`}
            className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white"
          >
            Absen sekarang
          </Link>
        ) : null}
      </div>
    </article>
  )
}

export function ScheduleCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  )
}
