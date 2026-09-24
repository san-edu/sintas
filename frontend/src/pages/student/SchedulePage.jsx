import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { useIsOnline } from '../../hooks/useIsOnline'
import {
  SCHOOL_TIMEZONE,
  formatSchoolDateLong,
  todaySchoolDate,
} from '../../lib/dateTime'
import { windowStatusLabel } from '../../lib/attendanceStatus'
import {
  ScheduleCard,
  ScheduleCardSkeleton,
} from '../../features/attendance/ScheduleCard'
import { useTodaySchedule } from '../../features/attendance/hooks/useTodaySchedule'

const GROUP_ORDER = ['BISA_ABSEN', 'BELUM_DIBUKA', 'SELESAI']

function groupItems(items) {
  const groups = new Map()
  GROUP_ORDER.forEach((status) => groups.set(status, []))
  items.forEach((item) => {
    const list = groups.get(item.windowStatus)
    if (list) list.push(item)
  })
  return GROUP_ORDER.map((status) => ({
    status,
    label: windowStatusLabel(status),
    items: groups.get(status),
  })).filter((group) => group.items.length > 0)
}

function TodayDateStrip() {
  const now = new Date()
  const day = new Intl.DateTimeFormat('id-ID', {
    timeZone: SCHOOL_TIMEZONE,
    weekday: 'short',
  }).format(now)
  const date = new Intl.DateTimeFormat('id-ID', {
    timeZone: SCHOOL_TIMEZONE,
    day: 'numeric',
  }).format(now)

  return (
    <div className="mt-4 flex gap-2">
      <div className="flex min-w-14 flex-col items-center justify-center rounded-lg border border-black/20 bg-blue-400 py-2 text-white">
        <span>{day}</span>
        <span className="font-bold">{date}</span>
        <div className="mt-2 h-2 w-2 rounded-full bg-white" />
      </div>
    </div>
  )
}

function GroupList({ items }) {
  const groups = groupItems(items)
  if (groups.length === 0) return null

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.status} aria-label={group.label}>
          <h2 className="text-xl font-semibold text-ink-900">
            {group.label}
            <span className="ml-2 text-xs font-normal text-slate-500">
              {group.items.length} sesi
            </span>
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {group.items.map((item) => (
              <ScheduleCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function StudentSchedulePage() {
  const online = useIsOnline()
  const today = useTodaySchedule()
  const items = today.data ?? []

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Jadwal</h1>
        <p className="mt-1 text-sm text-slate-700">
          {formatSchoolDateLong(todaySchoolDate())}
        </p>
        <TodayDateStrip />
      </div>

      <SectionState
        query={today}
        online={online}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title="Belum ada pelajaran pada tanggal ini"
            message="Sesi absensi untuk kelas Anda akan muncul mulai 15 menit sebelum jam mulai."
          />
        }
        skeleton={
          <div className="flex flex-col gap-4">
            {[0, 1, 2, 3].map((value) => (
              <ScheduleCardSkeleton key={value} />
            ))}
          </div>
        }
        errorTitle="Jadwal tidak dapat dimuat."
      >
        <GroupList items={items} />
      </SectionState>
    </section>
  )
}
