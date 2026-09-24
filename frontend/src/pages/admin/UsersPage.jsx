import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { SectionState } from '../../components/feedback/SectionState'
import { Pagination } from '../../components/common/Pagination'
import { Skeleton } from '../../components/common/Skeleton'
import { useIsOnline } from '../../hooks/useIsOnline'
import { roleLabel } from '../../lib/permissions'
import { UserFormDialog } from '../../features/admin/forms/UserFormDialog'
import { ResetPasswordDialog } from '../../features/admin/forms/ResetPasswordDialog'
import { useAdminUsers } from '../../features/admin/hooks/useAdminUsers'
import { UserDesktopTable, UserMobileList } from '../../features/admin/views/UserViews'

const ROLE_OPTIONS = ['ADMIN', 'TEACHER', 'STUDENT']
const BASE = { page: 1, limit: 20 }

const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-black focus:outline-none'

export default function AdminUsersPage() {
  const online = useIsOnline()
  const [applied, setApplied] = useState({ ...BASE, search: '', role: '' })
  const [draft, setDraft] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState(null)

  const filters = {
    page: applied.page,
    limit: applied.limit,
    search: applied.search || undefined,
    role: applied.role || undefined,
  }
  const usersQuery = useAdminUsers(filters)
  const items = usersQuery.data?.items ?? []
  const meta = usersQuery.data?.meta ?? { total: 0, totalPages: 0 }

  const applyDraft = (event) => {
    event.preventDefault()
    setApplied((current) => ({ ...current, search: draft.trim(), page: 1 }))
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Pengguna</h1>
          <p className="mt-1 text-sm text-slate-700">Daftar akun, peran, dan reset password.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <AddRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Tambah pengguna
        </button>
      </div>

      <form
        onSubmit={applyDraft}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-4"
      >
        <div className="min-w-52 flex-1">
          <label htmlFor="user-search" className="block text-sm font-medium text-slate-700">
            Cari nama atau username
          </label>
          <input
            id="user-search"
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Contoh: budi"
            className={inputClass}
          />
        </div>
        <div className="min-w-40">
          <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">
            Peran
          </label>
          <select
            id="user-role"
            value={applied.role}
            onChange={(event) =>
              setApplied((current) => ({ ...current, role: event.target.value, page: 1 }))
            }
            className={inputClass}
          >
            <option value="">Semua peran</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
        >
          <SearchRoundedIcon className="h-4! w-4!" aria-hidden="true" />
          Terapkan
        </button>
      </form>

      <SectionState
        query={usersQuery}
        online={online}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title="Tidak ada pengguna yang cocok"
            message={
              applied.search || applied.role
                ? 'Ubah kata kunci atau filter peran, lalu coba lagi.'
                : 'Buat akun pengguna pertama.'
            }
            action={
              applied.search || applied.role ? undefined : (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  <PersonAddRoundedIcon className="h-4! w-4!" aria-hidden="true" />
                  Tambah pengguna
                </button>
              )
            }
          />
        }
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2].map((value) => (
              <Skeleton key={value} className="h-16 w-full" />
            ))}
          </div>
        }
        errorTitle="Pengguna tidak dapat dimuat."
      >
        <UserMobileList items={items} onResetPassword={setPasswordTarget} />
        <UserDesktopTable items={items} onResetPassword={setPasswordTarget} />

        <Pagination
          page={filters.page}
          totalPages={meta.totalPages}
          total={meta.total}
          label="pengguna"
          onChange={(page) => setApplied((current) => ({ ...current, page }))}
        />
      </SectionState>

      <UserFormDialog key={createOpen ? 'open' : 'closed'} open={createOpen} onClose={() => setCreateOpen(false)} />
      <ResetPasswordDialog
        key={passwordTarget ? passwordTarget.id : 'closed'}
        open={passwordTarget !== null}
        user={passwordTarget}
        onClose={() => setPasswordTarget(null)}
      />
    </section>
  )
}
