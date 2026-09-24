import { StatusBadge } from '../../components/common/StatusBadge'
import {
  attendanceStatusLabel,
  attendanceStatusTone,
} from '../../lib/attendanceStatus'
import { formatSchoolDate, formatSchoolTime } from '../../lib/dateTime'

// Daftar riwayat mobile mengikuti golden master `features/riwayat/Riwayat.tsx`
// (baris tanggal | mapel/kelas | status). Tabel desktop tetap ada untuk layar
// besar (docs/DESIGN_BRIEF.md S5) dengan palet/token golden master.
export function HistoryMobileList({ items, onSelect }) {
  return (
    <ul className="flex flex-col gap-3 sm:hidden">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-4 text-left"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-semibold text-ink-900">
                {formatSchoolDate(item.sessionDate)}
              </span>
              <span className="truncate text-sm text-slate-700">
                {item.scannedAt
                  ? formatSchoolTime(item.scannedAt)
                  : 'Tidak tercatat'}{' '}
                · {item.subjectName ?? '—'}
                {item.className ? ` · ${item.className}` : ''}
              </span>
              {item.status === 'TERLAMBAT' ? (
                <span className="mt-1 text-sm font-semibold text-orange-700">
                  Terlambat {item.lateMinutes} menit
                </span>
              ) : null}
            </span>
            <StatusBadge
              status={item.status}
              label={attendanceStatusLabel(item.status)}
              tone={attendanceStatusTone(item.status)}
            />
          </button>
        </li>
      ))}
    </ul>
  )
}

export function HistoryDesktopTable({ items, onSelect }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-black/10 bg-white sm:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Riwayat absensi pribadi</caption>
        <thead className="bg-black/5 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Tanggal sesi</th>
            <th scope="col" className="px-4 py-3 font-semibold">Jam scan</th>
            <th scope="col" className="px-4 py-3 font-semibold">Mata pelajaran / Kelas</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            <th scope="col" className="px-4 py-3 font-semibold">Menit terlambat</th>
            <th scope="col" className="sr-only px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-black/5">
              <td className="px-4 py-3 font-semibold text-ink-900">
                {formatSchoolDate(item.sessionDate)}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {item.scannedAt ? formatSchoolTime(item.scannedAt) : '—'}
              </td>
              <td className="px-4 py-3">
                <span className="block font-semibold text-ink-900">
                  {item.subjectName ?? '—'}
                </span>
                <span className="block text-xs text-slate-700">
                  {item.className ?? ''}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  status={item.status}
                  label={attendanceStatusLabel(item.status)}
                  tone={attendanceStatusTone(item.status)}
                />
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {item.status === 'TERLAMBAT' ? `${item.lateMinutes} menit` : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-500"
                >
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
