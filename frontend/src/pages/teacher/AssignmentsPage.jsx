import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { AssignmentCard, AssignmentCardSkeleton } from '../../features/teacher/AssignmentCard'
import { useTeacherAssignments } from '../../features/teacher/hooks/useTeacherAssignments'
import { useIsOnline } from '../../hooks/useIsOnline'
import { useSessionStore } from '../../stores/sessionStore'

export default function TeacherAssignmentsPage() {
  const online = useIsOnline()
  const user = useSessionStore((state) => state.user)
  const assignmentsQuery = useTeacherAssignments()
  const assignments = assignmentsQuery.data ?? []

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Penugasan saya</h1>
        <p className="mt-1 text-sm text-slate-700">
          Daftar kelas dan mata pelajaran aktif yang ditugaskan kepada Anda. Buat
          sesi absensi dari salah satu penugasan.
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((value) => (
              <AssignmentCardSkeleton key={value} />
            ))}
          </div>
        }
        errorTitle="Penugasan tidak dapat dimuat."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <AssignmentCard assignment={assignment} teacherName={user?.name} />
            </li>
          ))}
        </ul>
      </SectionState>
    </section>
  )
}
