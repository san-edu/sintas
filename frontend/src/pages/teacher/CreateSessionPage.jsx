import { useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Skeleton } from '../../components/common/Skeleton'
import { SessionForm } from '../../features/teacher/SessionForm'
import { useTeacherAssignments } from '../../features/teacher/hooks/useTeacherAssignments'
import { useIsOnline } from '../../hooks/useIsOnline'
import { useSessionStore } from '../../stores/sessionStore'

export default function TeacherCreateSessionPage() {
  const online = useIsOnline()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useSessionStore((state) => state.user)
  const assignmentsQuery = useTeacherAssignments()
  const assignments = assignmentsQuery.data ?? []

  const requested = Number(searchParams.get('assignmentId'))
  const defaultAssignmentId = assignments.some(
    (assignment) => assignment.id === requested,
  )
    ? requested
    : undefined

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Buat sesi absensi</h1>
        <p className="mt-1 text-sm text-slate-700">
          Pilih penugasan dan waktu sesi. QR Code dibuat server setelah sesi
          tersimpan.
        </p>
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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        }
        errorTitle="Penugasan tidak dapat dimuat."
      >
        <SessionForm
          assignments={assignments}
          defaultAssignmentId={defaultAssignmentId}
          teacherName={user?.name}
          onCreated={(session) =>
            navigate(`/app/teacher/sessions/${session.id}/qr`)
          }
        />
      </SectionState>
    </section>
  )
}
