import { StatusBadge } from '../../components/common/StatusBadge'
import {
  attendanceStatusLabel,
  attendanceStatusTone,
} from '../../lib/attendanceStatus'
import { formatSchoolDate, formatSchoolTime } from '../../lib/dateTime'

function LateMinutes({ item }) {
  if (item.status !== 'TERLAMBAT') return <span className="text-slate-700">—</span>
  return <span className="font-semibold text-orange-700">{item.lateMinutes} menit</span>
}

export function ClassAttendanceMobileList({ items }) {
  return (
    <ul className="space-y-3 sm:hidden">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-black/10 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-ink-900">{item.studentName}</p>
              <p className="text-xs text-slate-700">
                {item.studentNumber ? `NIM ${item.studentNumber}` : 'NIM —'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {item.subjectName ?? '—'}
                {item.className ? ` • ${item.className}` : ''}
              </p>
              <p className="mt-1 text-xs text-slate-700">
                {formatSchoolDate(item.sessionDate)}
                {item.scannedAt ? ` • scan ${formatSchoolTime(item.scannedAt)}` : ''}
              </p>
            </div>
            <StatusBadge
              status={item.status}
              label={attendanceStatusLabel(item.status)}
              tone={attendanceStatusTone(item.status)}
            />
          </div>
          <p className="mt-2 text-xs text-slate-700">
            Menit terlambat: <LateMinutes item={item} />
          </p>
        </li>
      ))}
    </ul>
  )
}

export function ClassAttendanceDesktopTable({ items }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-black/10 bg-white sm:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Detail kehadiran siswa pada kelas ini</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Tanggal sesi</th>
            <th scope="col" className="p-3 font-semibold">Jam scan</th>
            <th scope="col" className="p-3 font-semibold">Siswa</th>
            <th scope="col" className="p-3 font-semibold">Mata pelajaran</th>
            <th scope="col" className="p-3 font-semibold">Status</th>
            <th scope="col" className="p-3 font-semibold">Menit terlambat</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 text-ink-900">
                {formatSchoolDate(item.sessionDate)}
              </td>
              <td className="p-3 text-slate-700">
                {item.scannedAt ? formatSchoolTime(item.scannedAt) : '—'}
              </td>
              <td className="p-3">
                <span className="block font-semibold text-ink-900">
                  {item.studentName}
                </span>
                <span className="block text-xs text-slate-700">
                  {item.studentNumber ? `NIM ${item.studentNumber}` : 'NIM —'}
                </span>
              </td>
              <td className="p-3">
                <span className="block text-ink-900">{item.subjectName ?? '—'}</span>
                <span className="block text-xs text-slate-700">
                  {item.className ?? ''}
                </span>
              </td>
              <td className="p-3">
                <StatusBadge
                  status={item.status}
                  label={attendanceStatusLabel(item.status)}
                  tone={attendanceStatusTone(item.status)}
                />
              </td>
              <td className="p-3">
                <LateMinutes item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
