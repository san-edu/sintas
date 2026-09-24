import { StatusBadge } from '../../../components/common/StatusBadge'
import {
  attendanceStatusLabel,
  attendanceStatusTone,
} from '../../../lib/attendanceStatus'
import { formatSchoolDate, formatSchoolTime } from '../../../lib/dateTime'

export function ReportMobileList({ items }) {
  return (
    <ul className="space-y-3 sm:hidden">
      {items.map((item) => (
        <li key={item.id}>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <span className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-semibold text-ink-900">
                  {formatSchoolDate(item.sessionDate)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-700">
                  {item.className ?? '—'} • {item.subjectName ?? '—'}
                </span>
              </span>
              <StatusBadge
                status={item.status}
                label={attendanceStatusLabel(item.status)}
                tone={attendanceStatusTone(item.status)}
              />
            </span>
            <span className="mt-1 block text-sm text-ink-900">{item.studentName}</span>
            <span className="mt-0.5 block text-xs text-slate-700">
              {item.studentNumber ? `NISN ${item.studentNumber}` : ''}
              {item.scannedAt ? ` • Scan ${formatSchoolTime(item.scannedAt)}` : ''}
              {item.status === 'TERLAMBAT' ? ` • Terlambat ${item.lateMinutes} menit` : ''}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ReportDesktopTable({ items }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-black/10 bg-white sm:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Laporan kehadiran global</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Tanggal sesi</th>
            <th scope="col" className="p-3 font-semibold">Kelas</th>
            <th scope="col" className="p-3 font-semibold">Mata pelajaran</th>
            <th scope="col" className="p-3 font-semibold">Siswa</th>
            <th scope="col" className="p-3 font-semibold">Jam scan</th>
            <th scope="col" className="p-3 font-semibold">Status</th>
            <th scope="col" className="p-3 font-semibold">Terlambat</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 text-ink-900">
                {formatSchoolDate(item.sessionDate)}
              </td>
              <td className="p-3 font-semibold text-ink-900">{item.className ?? '—'}</td>
              <td className="p-3 text-slate-700">{item.subjectName ?? '—'}</td>
              <td className="p-3 text-ink-900">{item.studentName}</td>
              <td className="p-3 text-slate-700">
                {item.scannedAt ? formatSchoolTime(item.scannedAt) : '—'}
              </td>
              <td className="p-3">
                <StatusBadge
                  status={item.status}
                  label={attendanceStatusLabel(item.status)}
                  tone={attendanceStatusTone(item.status)}
                />
              </td>
              <td className="p-3 font-semibold text-slate-700">
                {item.status === 'TERLAMBAT' ? `${item.lateMinutes} menit` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
