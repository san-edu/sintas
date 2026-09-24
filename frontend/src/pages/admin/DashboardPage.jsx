import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/common/Skeleton'
import { getErrorMessage, isNetworkError } from '../../lib/errorMapping'
import { useSessionStore } from '../../stores/sessionStore'
import { useMemberships } from '../../features/admin/hooks/usePlotting'
import { useClasses } from '../../features/admin/hooks/useAcademicMasters'
import { useAdminUsers } from '../../features/admin/hooks/useAdminUsers'
import { useTeacherSessions } from '../../features/teacher/hooks/useTeacherSessions'

const QUICK_LINKS = [
  { to: '/app/admin/banners', label: 'Banner sekolah', description: 'Atur banner yang tampil di beranda.', icon: CampaignRoundedIcon },
  { to: '/app/admin/users', label: 'Pengguna', description: 'Kelola akun dan reset password.', icon: GroupOutlinedIcon },
  { to: '/app/admin/academic', label: 'Akademik', description: 'Jenjang, kelas, dan mata pelajaran.', icon: SchoolRoundedIcon },
  { to: '/app/admin/plotting', label: 'Penempatan', description: 'Siswa pada kelas dan guru.', icon: HubOutlinedIcon },
  { to: '/app/admin/reports', label: 'Laporan kehadiran', description: 'Rekap global dan export.', icon: BarChartRoundedIcon },
]

function SummaryCard({ label, value, loading, error }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <p className="text-xs font-medium text-slate-700">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : error ? (
        <p className="mt-2 font-semibold text-danger-700">—</p>
      ) : (
        <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
      )}
    </div>
  )
}

// ringkasan berasal dari meta.total endpoint list yang ada — tanpa endpoint
// analitik baru di luar PRD (docs/DECISIONS.md D14).
export default function AdminDashboardPage() {
  const user = useSessionStore((state) => state.user)
  const usersQuery = useAdminUsers({ page: 1, limit: 1 })
  const classesQuery = useClasses({ page: 1, limit: 1 })
  const membershipsQuery = useMemberships({ page: 1, limit: 1 })
  const sessionsQuery = useTeacherSessions()
  const anyNetworkError = [usersQuery, classesQuery, membershipsQuery, sessionsQuery].some(
    (query) => isNetworkError(query.error),
  )

  const counts = [
    { label: 'Pengguna', value: usersQuery.data?.meta?.total, query: usersQuery },
    { label: 'Kelas', value: classesQuery.data?.meta?.total, query: classesQuery },
    { label: 'Penempatan siswa', value: membershipsQuery.data?.meta?.total, query: membershipsQuery },
    { label: 'Sesi absensi', value: sessionsQuery.data?.length, query: sessionsQuery },
  ]

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Beranda Admin</h1>
        <p className="mt-1 text-sm text-slate-700">Halo {user?.name}, kelola sekolah melalui menu berikut.</p>
      </div>

      {anyNetworkError ? (
        <div
          role="alert"
          className="rounded-lg border border-black/10 bg-white px-4 py-3 text-sm text-ink-900"
        >
          <span className="font-semibold text-danger-700">Tidak dapat memuat sebagian ringkasan.</span> {getErrorMessage(usersQuery.error ?? classesQuery.error)}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((count) => (
          <SummaryCard
            key={count.label}
            label={count.label}
            value={count.value ?? 0}
            loading={count.query.isPending}
            error={count.query.isError}
          />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink-900">Kelola</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((entry) => {
            const Icon = entry.icon
            return (
              <Link
                key={entry.to}
                to={entry.to}
                className="group flex items-center gap-3 rounded-xl border border-black/10 bg-white p-5 transition hover:border-blue-500 focus-visible:outline-blue-500"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                  <Icon className="h-5! w-5!" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-900 group-hover:text-blue-500">
                    {entry.label}
                  </span>
                  <span className="block text-xs text-slate-700">{entry.description}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
