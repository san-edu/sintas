import PermIdentityRoundedIcon from '@mui/icons-material/PermIdentityRounded'
import { ProfileForm } from '../../features/profile/ProfileForm'
import { ROLES, roleLabel } from '../../lib/permissions'
import { useSessionStore } from '../../stores/sessionStore'

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-ink-900">{value || '—'}</dd>
    </div>
  )
}

// Layout profil mengikuti golden master `features/profil/Profil.tsx`: avatar
// bulat biru, identitas role, lalu kartu identitas read-only + form data.
export default function ProfilePage() {
  const user = useSessionStore((state) => state.user)
  if (!user) return null

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-ink-900">Profil</h1>
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <PermIdentityRoundedIcon className="h-12! w-12! text-blue-500" />
        </div>
        <p className="text-xl font-bold text-ink-900">{user.name}</p>
        <p className="text-sm text-slate-700">
          {roleLabel(user.role)}
          {user.role === ROLES.STUDENT
            ? ` · ${user.studentNumber || ''}`
            : ''}
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6">
        <h2 className="text-lg font-bold text-ink-900">Identitas</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ReadOnlyField label="Username" value={user.username} />
          {user.role === ROLES.STUDENT ? (
            <ReadOnlyField label="NIM" value={user.studentNumber} />
          ) : null}
          <ReadOnlyField label="Peran" value={roleLabel(user.role)} />
        </dl>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6">
        <h2 className="text-lg font-bold text-ink-900">Data profil</h2>
        <p className="mt-1 text-sm text-slate-700">
          Perubahan hanya berlaku pada akun Anda dan disimpan oleh server.
        </p>
        <div className="mt-4">
          <ProfileForm user={user} />
        </div>
      </div>
    </section>
  )
}
