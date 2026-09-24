import { Link } from 'react-router-dom'
import { formatSchoolDate, formatSchoolTime } from '../../lib/dateTime'

function Actions({ session }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to={`/app/teacher/sessions/${session.id}/qr`}
        className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
      >
        Lihat QR
      </Link>
      <Link
        to={`/app/teacher/classes/${session.classId}/attendance`}
        className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
      >
        Kehadiran
      </Link>
    </div>
  )
}

export function SessionMobileList({ items }) {
  return (
    <ul className="space-y-3 sm:hidden">
      {items.map((session) => (
        <li
          key={session.id}
          className="rounded-xl border border-black/10 bg-white p-4"
        >
          <p className="text-sm font-semibold text-ink-900">
            {formatSchoolDate(session.sessionDate)}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            {formatSchoolTime(session.startAt)}–{formatSchoolTime(session.endAt)}
          </p>
          <p className="mt-1 font-semibold text-ink-900">{session.subjectName ?? '—'}</p>
          <p className="text-xs text-slate-700">{session.className ?? ''}</p>
          <div className="mt-3">
            <Actions session={session} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SessionDesktopTable({ items }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-black/10 bg-white sm:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Daftar sesi absensi yang Anda buat</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Tanggal sesi</th>
            <th scope="col" className="p-3 font-semibold">Waktu</th>
            <th scope="col" className="p-3 font-semibold">Mata pelajaran / Kelas</th>
            <th scope="col" className="p-3 font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((session) => (
            <tr key={session.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 text-ink-900">
                {formatSchoolDate(session.sessionDate)}
              </td>
              <td className="p-3 text-slate-700">
                {formatSchoolTime(session.startAt)}–{formatSchoolTime(session.endAt)}
              </td>
              <td className="p-3">
                <span className="block font-semibold text-ink-900">
                  {session.subjectName ?? '—'}
                </span>
                <span className="block text-xs text-slate-700">
                  {session.className ?? ''}
                </span>
              </td>
              <td className="p-3">
                <Actions session={session} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
