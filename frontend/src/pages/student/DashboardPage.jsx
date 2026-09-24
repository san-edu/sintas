import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded'
import PermIdentityRoundedIcon from '@mui/icons-material/PermIdentityRounded'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Skeleton } from '../../components/common/Skeleton'
import FeatureGrid from '../../components/common/FeatureGrid'
import PillSearch from '../../components/common/PillSearch'
import { useIsOnline } from '../../hooks/useIsOnline'
import { formatSchoolDateLong, todaySchoolDate } from '../../lib/dateTime'
import { useSessionStore } from '../../stores/sessionStore'
import { useActiveBanners } from '../../features/banners/hooks/useActiveBanners'
import BannerCarousel from '../../features/banners/BannerCarousel'
import {
  ScheduleCard,
  ScheduleCardSkeleton,
} from '../../features/attendance/ScheduleCard'
import { useTodaySchedule } from '../../features/attendance/hooks/useTodaySchedule'
import { AttendanceSummary } from '../../features/student/AttendanceSummary'

// Fitur beranda siswa mengikuti golden master FeatureGrid (PLAN_MERGE_UI §5.2)
// dengan route produksi, bukan route mock.
const STUDENT_FEATURES = [
  { name: 'Absen', link: '/app/student/scan', icon: QrCodeScannerRoundedIcon },
  { name: 'Jadwal', link: '/app/student/schedule', icon: CalendarMonthRoundedIcon },
  { name: 'Riwayat', link: '/app/student/history', icon: HistoryRoundedIcon },
  { name: 'Profil', link: '/app/student/profile', icon: PersonOutlineRoundedIcon },
]

function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || 'Siswa'
}

function BannerSection() {
  const online = useIsOnline()
  const banners = useActiveBanners()
  const items = banners.data ?? []

  return (
    <SectionState
      query={banners}
      online={online}
      skeleton={<Skeleton className="h-32 w-full" />}
      errorTitle="Banner tidak dapat dimuat."
      empty={null}
    >
      {items.length > 0 ? (
        <div className="overflow-hidden rounded-xl">
          <BannerCarousel items={items} />
        </div>
      ) : null}
    </SectionState>
  )
}

function ScheduleItems({ items }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <ScheduleCard item={item} />
        </li>
      ))}
    </ul>
  )
}

function TodaySummary({ query, online }) {
  return (
    <SectionState
      query={query}
      online={online}
      skeleton={<Skeleton className="h-32 w-full rounded-lg" />}
    >
      <AttendanceSummary items={query.data ?? []} />
    </SectionState>
  )
}

function ScheduleSection({ query, online, search = '' }) {
  const raw = query.data ?? []
  const normalized = search.trim().toLowerCase()
  const items = normalized
    ? raw.filter((item) =>
        (item.subjectName ?? '').toLowerCase().includes(normalized),
      )
    : raw

  return (
    <SectionState
      query={query}
      online={online}
      isEmpty={raw.length === 0}
      empty={
        <EmptyState
          title="Belum ada jadwal hari ini"
          message="Jadwal sesi akan muncul di sini."
          action={
            <Link
              to="/app/student/schedule"
              className="mt-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Lihat jadwal
            </Link>
          }
        />
      }
      skeleton={
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((value) => (
            <ScheduleCardSkeleton key={value} />
          ))}
        </div>
      }
      errorTitle="Jadwal tidak dapat dimuat."
    >
      {items.length > 0 ? (
        <ScheduleItems items={items.slice(0, 3)} />
      ) : (
        <p className="rounded-lg border border-black/10 bg-white p-4 text-sm text-slate-700">
          Tidak ada jadwal yang cocok dengan pencarian.
        </p>
      )}
    </SectionState>
  )
}

export default function StudentDashboardPage() {
  const online = useIsOnline()
  const user = useSessionStore((state) => state.user)
  const today = useTodaySchedule()
  const [search, setSearch] = useState('')

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <PermIdentityRoundedIcon className="h-9! w-9! text-blue-500" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-ink-900">
              Halo, {firstName(user?.name)}
            </h1>
            <p className="truncate text-sm text-slate-700">
              {formatSchoolDateLong(todaySchoolDate())}
            </p>
          </div>
        </div>

        <Link
          to="/app/student/profile"
          aria-label="Buka profil"
          title="Profil"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100"
        >
          <PersonOutlineRoundedIcon className="h-6! w-6! text-blue-500" />
        </Link>
      </header>

      <PillSearch
        value={search}
        onChange={setSearch}
        placeholder="Cari fitur atau jadwal"
      />

      <BannerSection />

      <section aria-label="Ringkasan absensi hari ini">
        <TodaySummary query={today} online={online} />
      </section>

      <section aria-label="Jadwal terdekat" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink-900">Jadwal terdekat</h2>
          <Link
            to="/app/student/schedule"
            className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-500"
          >
            Lihat jadwal
          </Link>
        </div>
        <ScheduleSection query={today} online={online} search={search} />
      </section>

      <FeatureGrid features={STUDENT_FEATURES} search={search} />

      <nav aria-label="Akses cepat" className="flex flex-col gap-3">
        <Link
          to="/app/student/history"
          className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <HistoryRoundedIcon className="h-5! w-5! text-blue-500" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink-900">
              Riwayat absensi
            </span>
            <span className="block text-xs text-slate-700">
              Lihat catatan kehadiran pribadi.
            </span>
          </span>
        </Link>
        <Link
          to="/app/student/profile"
          className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <PersonOutlineRoundedIcon className="h-5! w-5! text-blue-500" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink-900">Profil</span>
            <span className="block text-xs text-slate-700">
              Perbarui data profil Anda.
            </span>
          </span>
        </Link>
      </nav>
    </section>
  )
}
