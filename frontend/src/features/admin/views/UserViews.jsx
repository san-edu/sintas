import KeyRoundedIcon from '@mui/icons-material/KeyRounded'
import { roleLabel } from '../../../lib/permissions'
import { StatusBadge } from '../../../components/common/StatusBadge'

const ROLE_TONE = {
  ADMIN: 'info',
  TEACHER: 'warning',
  STUDENT: 'neutral',
}

export function UserMobileList({ items, onResetPassword }) {
  return (
    <ul className="space-y-3 sm:hidden">
      {items.map((user) => (
        <li key={user.id}>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-semibold text-ink-900">{user.name}</span>
                <span className="mt-0.5 block text-xs text-slate-700">@{user.username}</span>
              </span>
              <StatusBadge status={roleLabel(user.role)} tone={ROLE_TONE[user.role]} />
            </span>
            <span className="mt-1 block text-xs text-slate-700">
              {user.studentNumber ? `NISN ${user.studentNumber}` : user.email ?? 'Tanpa email'}
            </span>
            <button
              type="button"
              onClick={() => onResetPassword(user)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
            >
              <KeyRoundedIcon className="h-4! w-4!" aria-hidden="true" />
              Reset password
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function UserDesktopTable({ items, onResetPassword }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-black/10 bg-white sm:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Daftar pengguna</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Nama</th>
            <th scope="col" className="p-3 font-semibold">Username</th>
            <th scope="col" className="p-3 font-semibold">Peran</th>
            <th scope="col" className="p-3 font-semibold">NISN / Email</th>
            <th scope="col" className="sr-only p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((user) => (
            <tr key={user.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 font-semibold text-ink-900">{user.name}</td>
              <td className="p-3 text-slate-700">@{user.username}</td>
              <td className="p-3">
                <StatusBadge status={roleLabel(user.role)} tone={ROLE_TONE[user.role]} />
              </td>
              <td className="p-3 text-slate-700">
                {user.studentNumber ? `NISN ${user.studentNumber}` : user.email ?? '—'}
              </td>
              <td className="p-3 text-right">
                <button
                  type="button"
                  onClick={() => onResetPassword(user)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
                >
                  <KeyRoundedIcon className="h-4! w-4!" aria-hidden="true" />
                  Reset password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
