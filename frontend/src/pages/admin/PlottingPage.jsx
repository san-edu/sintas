import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { useState } from 'react'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Pagination } from '../../components/common/Pagination'
import { Skeleton } from '../../components/common/Skeleton'
import { useIsOnline } from '../../hooks/useIsOnline'
import { useClasses } from '../../features/admin/hooks/useAcademicMasters'
import { useAdminUsers } from '../../features/admin/hooks/useAdminUsers'
import {
  useAssignmentsManage,
  useMemberships,
  useUpdateAssignment,
  useUpdateMembership,
} from '../../features/admin/hooks/usePlotting'
import { AssignmentFormDialog } from '../../features/admin/forms/AssignmentFormDialog'
import { MembershipFormDialog } from '../../features/admin/forms/MembershipFormDialog'
import {
  AssignmentsManageTable,
  MembershipsTable,
} from '../../features/admin/views/PlottingViews'

const TABS = [
  { key: 'memberships', label: 'Siswa pada kelas' },
  { key: 'assignments', label: 'Guru pada kelas' },
]
const LIMIT = 20

const selectClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-black focus:outline-none'

export default function AdminPlottingPage() {
  const online = useIsOnline()
  const [tab, setTab] = useState('memberships')
  const [page, setPage] = useState(1)
  const [classId, setClassId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  const classesQuery = useClasses({ page: 1, limit: 100 })
  const teachersQuery = useAdminUsers({ page: 1, limit: 100, role: 'TEACHER' })
  const membershipsQuery = useMemberships({ page, limit: LIMIT, classId: classId || undefined })
  const assignmentsQuery = useAssignmentsManage({ page, limit: LIMIT, teacherId: teacherId || undefined })
  const updateMembership = useUpdateMembership()
  const updateAssignment = useUpdateAssignment()

  const classes = classesQuery.data?.items ?? []
  const teachers = teachersQuery.data?.items ?? []
  const itemList = tab === 'memberships' ? (membershipsQuery.data?.items ?? []) : (assignmentsQuery.data?.items ?? [])
  const meta = tab === 'memberships' ? membershipsQuery.data?.meta : assignmentsQuery.data?.meta
  const activeQuery = tab === 'memberships' ? membershipsQuery : assignmentsQuery

  const activeUpdate = tab === 'memberships' ? updateMembership : updateAssignment
  const pendingId = activeUpdate.isPending ? activeUpdate.variables?.id : null

  const setActive = (item, isActive) => {
    const mutation = tab === 'memberships' ? updateMembership : updateAssignment
    mutation.mutate({ id: item.id, data: { isActive } })
  }

  const onToggle = (item) => {
    if (item.isActive) {
      setDeactivateTarget(item)
      return
    }
    setActive(item, true)
  }

  const confirmDeactivate = () => {
    if (!deactivateTarget) return
    setActive(deactivateTarget, false)
    setDeactivateTarget(null)
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Penempatan</h1>
        <p className="mt-1 text-sm text-slate-700">Kelola penempatan siswa dan penugasan guru.</p>
      </div>

      <div role="tablist" aria-label="Penempatan" className="flex flex-wrap gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={tab === entry.key}
            onClick={() => {
              setTab(entry.key)
              setPage(1)
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === entry.key
                ? 'bg-blue-500 text-white'
                : 'border border-black/10 bg-white text-slate-700 hover:bg-blue-100/50'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-4">
        {tab === 'memberships' ? (
          <div className="min-w-60">
            <label htmlFor="membership-class-filter" className="block text-sm font-medium text-slate-700">
              Kelas
            </label>
            <select
              id="membership-class-filter"
              value={classId}
              onChange={(event) => {
                setClassId(event.target.value)
                setPage(1)
              }}
              className={selectClass}
            >
              <option value="">Semua kelas</option>
              {classes.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="min-w-60">
            <label htmlFor="assignment-teacher-filter" className="block text-sm font-medium text-slate-700">
              Guru
            </label>
            <select
              id="assignment-teacher-filter"
              value={teacherId}
              onChange={(event) => {
                setTeacherId(event.target.value)
                setPage(1)
              }}
              className={selectClass}
            >
              <option value="">Semua guru</option>
              {teachers.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white"
        >
          <AddRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Tambah
        </button>
      </div>

      <SectionState
        query={activeQuery}
        online={online}
        isEmpty={itemList.length === 0}
        empty={
          <EmptyState
            title={tab === 'memberships' ? 'Belum ada penempatan siswa' : 'Belum ada penugasan guru'}
            message={
              tab === 'memberships'
                ? 'Tambahkan penempatan siswa untuk kelas ini.'
                : 'Tambahkan penugasan guru untuk kelas dan mata pelajaran.'
            }
          />
        }
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2].map((value) => (
              <Skeleton key={value} className="h-14 w-full" />
            ))}
          </div>
        }
        errorTitle={tab === 'memberships' ? 'Penempatan siswa tidak dapat dimuat.' : 'Penugasan guru tidak dapat dimuat.'}
      >
        {tab === 'memberships' ? (
          <MembershipsTable items={itemList} onToggle={onToggle} pendingId={pendingId} />
        ) : (
          <AssignmentsManageTable items={itemList} onToggle={onToggle} pendingId={pendingId} />
        )}

        <Pagination
          page={page}
          totalPages={meta?.totalPages ?? 0}
          total={meta?.total ?? 0}
          label={tab === 'memberships' ? 'penempatan' : 'penugasan'}
          onChange={setPage}
        />
      </SectionState>

      {tab === 'memberships' ? (
        <MembershipFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
      ) : (
        <AssignmentFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
      )}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Nonaktifkan data"
        message={
          tab === 'memberships'
            ? `Nonaktifkan penempatan ${deactivateTarget?.student?.name ?? 'siswa ini'}? Riwayat absensi tetap tersimpan.`
            : `Nonaktifkan penugasan ${deactivateTarget?.teacher?.name ?? 'guru ini'}? Sesi terkait tidak lagi muncul untuk guru.`
        }
        confirmLabel="Nonaktifkan"
        busy={activeUpdate.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </section>
  )
}
