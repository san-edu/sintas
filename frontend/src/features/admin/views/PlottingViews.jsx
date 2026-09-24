import { StatusBadge } from '../../../components/common/StatusBadge'
import { formatSchoolDate } from '../../../lib/dateTime'

function MembershipStatus({ isActive }) {
  return (
    <StatusBadge
      status={isActive ? 'Aktif' : 'Nonaktif'}
      tone={isActive ? 'success' : 'neutral'}
    />
  )
}

export function MembershipsTable({ items }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Penempatan siswa</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Kelas</th>
            <th scope="col" className="p-3 font-semibold">Siswa</th>
            <th scope="col" className="p-3 font-semibold">NISN</th>
            <th scope="col" className="p-3 font-semibold">Sejak</th>
            <th scope="col" className="p-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((membership) => (
            <tr key={membership.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 font-semibold text-ink-900">
                {membership.class?.name ?? '—'}
              </td>
              <td className="p-3 text-ink-900">{membership.student?.name ?? '—'}</td>
              <td className="p-3 text-slate-700">
                {membership.student?.studentNumber ?? '—'}
              </td>
              <td className="p-3 text-slate-700">
                {formatSchoolDate(membership.createdAt)}
              </td>
              <td className="p-3">
                <MembershipStatus isActive={membership.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AssignmentsManageTable({ items }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/10 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Penugasan guru</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Kelas</th>
            <th scope="col" className="p-3 font-semibold">Mata pelajaran</th>
            <th scope="col" className="p-3 font-semibold">Guru</th>
            <th scope="col" className="p-3 font-semibold">Sejak</th>
            <th scope="col" className="p-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((assignment) => (
            <tr key={assignment.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 font-semibold text-ink-900">
                {assignment.class?.name ?? '—'}
              </td>
              <td className="p-3 text-ink-900">
                {assignment.subject?.name ?? '—'}
              </td>
              <td className="p-3 text-slate-700">
                {assignment.teacher?.name ?? '—'}
              </td>
              <td className="p-3 text-slate-700">
                {formatSchoolDate(assignment.createdAt)}
              </td>
              <td className="p-3">
                <MembershipStatus isActive={assignment.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
