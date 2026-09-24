import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Skeleton } from '../../components/common/Skeleton'
import { useIsOnline } from '../../hooks/useIsOnline'
import { AssignmentCard, AssignmentCardSkeleton } from '../../features/teacher/AssignmentCard'
import {
  SessionDesktopTable,
  SessionMobileList,
} from '../../features/teacher/SessionViews'
import { useTeacherAssignments } from '../../features/teacher/hooks/useTeacherAssignments'
import { useTeacherSessions } from '../../features/teacher/hooks/useTeacherSessions'
import { useSessionStore } from '../../stores/sessionStore'

const RECENT_SESSION_LIMIT = 5
const ASSIGNMENT_PREVIEW_LIMIT = 4

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
        <Icon className="h-5! w-5!" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs text-slate-700">{label}</span>
        <span className="block text-xl font-bold text-ink-900">{value}</span>
      </span>
    </div>
  )
}

export default function TeacherDashboardPage() {
  const online = useIsOnline()
  const user = useSessionStore((state) => state.user)
  const assignmentsQuery = useTeacherAssignments()
  const sessionsQuery = useTeacherSessions()

  const assignments = assignmentsQuery.data ?? []
  const sessions = sessionsQuery.data ?? []
  const recentSessions = sessions.slice(0, RECENT_SESSION_LIMIT)

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            Beranda Guru
          </h1>
          <p className="mt-1 text-sm text-slate-700">
            Kelola sesi absensi dan pantau kehadiran kelas yang Anda ajar.
          </p>
        </div>
        <Link
          to="/app/teacher/sessions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <EventAvailableRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Buat sesi
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={ListAltRoundedIcon}
          label="Penugasan aktif"
          value={assignmentsQuery.isPending ? '…' : assignments.length}
        />
        <SummaryCard
          icon={QrCode2RoundedIcon}
          label="Sesi dibuat"
          value={sessionsQuery.isPending ? '…' : sessions.length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="teacher-assignments-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="teacher-assignments-heading" className="text-lg font-bold text-ink-900">
              Penugasan saya
            </h2>
            <Link to="/app/teacher/assignments" className="text-sm font-semibold text-blue-500">
              Lihat semua
            </Link>
          </div>
          <SectionState
            query={assignmentsQuery}
            online={online}
            isEmpty={assignments.length === 0}
            empty={
              <EmptyState
                title="Belum ada penugasan aktif"
                message="Hubungi admin untuk memplot Anda ke kelas dan mata pelajaran."
              />
            }
            skeleton={
              <div className="space-y-3">
                {[0, 1].map((value) => (
                  <AssignmentCardSkeleton key={value} />
                ))}
              </div>
            }
            errorTitle="Penugasan tidak dapat dimuat."
          >
            <ul className="space-y-3">
              {assignments.slice(0, ASSIGNMENT_PREVIEW_LIMIT).map((assignment) => (
                <li key={assignment.id}>
                  <AssignmentCard assignment={assignment} teacherName={user?.name} />
                </li>
              ))}
            </ul>
          </SectionState>
        </section>

        <section aria-labelledby="teacher-sessions-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="teacher-sessions-heading" className="text-lg font-bold text-ink-900">
              Sesi terbaru
            </h2>
            <Link to="/app/teacher/sessions" className="text-sm font-semibold text-blue-500">
              Lihat semua
            </Link>
          </div>
          <SectionState
            query={sessionsQuery}
            online={online}
            isEmpty={recentSessions.length === 0}
            empty={
              <EmptyState
                title="Belum ada sesi absensi"
                message="Buat sesi untuk menampilkan QR Code di kelas."
                action={
                  <Link
                    to="/app/teacher/sessions/new"
                    className="mt-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Buat sesi
                  </Link>
                }
              />
            }
            skeleton={
              <div className="space-y-3">
                {[0, 1, 2].map((value) => (
                  <Skeleton key={value} className="h-20 w-full" />
                ))}
              </div>
            }
            errorTitle="Sesi absensi tidak dapat dimuat."
          >
            <SessionMobileList items={recentSessions} />
            <SessionDesktopTable items={recentSessions} />
          </SectionState>
        </section>
      </div>
    </section>
  )
}
