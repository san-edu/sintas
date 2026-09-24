import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import { Link } from 'react-router-dom'

export function AssignmentCard({ assignment, teacherName }) {
  const subjectName = assignment.subject?.name ?? 'Mata pelajaran'
  const className = assignment.class?.name ?? 'Kelas'
  const levelName = assignment.class?.educationLevel?.name
  const destination = `/app/teacher/sessions/new?assignmentId=${assignment.id}`

  return (
    <article className="flex flex-col justify-between gap-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="min-w-0">
        <h3 className="truncate text-base font-bold text-ink-900">{subjectName}</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Kelas</dt>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
              <SchoolRoundedIcon className="h-5! w-5!" aria-hidden="true" />
            </span>
            <dd className="truncate">
              {className}
              {levelName ? ` • ${levelName}` : ''}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Guru</dt>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
              <PersonOutlineRoundedIcon className="h-5! w-5!" aria-hidden="true" />
            </span>
            <dd className="truncate">{teacherName ?? '—'}</dd>
          </div>
        </dl>
      </div>
      <Link
        to={destination}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
      >
        <MenuBookRoundedIcon className="h-4! w-4!" aria-hidden="true" />
        Buat sesi
      </Link>
    </article>
  )
}

export function AssignmentCardSkeleton() {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="h-5 w-32 animate-pulse rounded-lg bg-black/5 motion-reduce:animate-none" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded-lg bg-black/5 motion-reduce:animate-none" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded-lg bg-black/5 motion-reduce:animate-none" />
      <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-black/5 motion-reduce:animate-none" />
    </div>
  )
}
