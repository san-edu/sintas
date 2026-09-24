import { zodResolver } from '@hookform/resolvers/zod'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../lib/errorMapping'
import { SCHOOL_TIMEZONE, todaySchoolDate } from '../../lib/dateTime'
import { sessionFormSchema, toSessionPayload } from '../../schemas/session'
import PrimaryButton from '../../components/common/PrimaryButton'
import { useCreateSession } from './hooks/useCreateSession'

const SERVER_FIELD_MAP = {
  sessionDate: 'sessionDate',
  startAt: 'start',
  endAt: 'end',
}

function FieldError({ id, message }) {
  return message ? (
    <p id={id} className="mt-1 text-sm text-danger-700">
      {message}
    </p>
  ) : null
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-700">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
        <Icon className="h-5! w-5!" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs text-slate-700">{label}</span>
        <span className="block font-semibold text-ink-900">{value}</span>
      </span>
    </div>
  )
}

const inputClass =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-black focus:outline-none'

export function SessionForm({
  assignments,
  defaultAssignmentId,
  teacherName,
  onCreated,
}) {
  const [rootError, setRootError] = useState(null)
  const createSession = useCreateSession()
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      assignmentId: defaultAssignmentId ? String(defaultAssignmentId) : '',
      sessionDate: todaySchoolDate(),
      start: '08:00',
      end: '09:00',
    },
  })

  const selectedId = useWatch({ control, name: 'assignmentId' })
  const selected = assignments.find(
    (assignment) => String(assignment.id) === selectedId,
  )

  const onSubmit = (values) => {
    setRootError(null)
    createSession
      .mutateAsync(toSessionPayload(values))
      .then((session) => onCreated?.(session))
      .catch((error) => {
        const entries = Object.entries(getFieldErrors(error))
        let handled = false
        entries.forEach(([name, messages]) => {
          const field = SERVER_FIELD_MAP[name]
          if (!field) return
          handled = true
          setError(field, { type: 'server', message: messages[0] })
        })
        if (!handled) setRootError(getErrorMessage(error))
      })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {rootError ? (
        <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
          {rootError}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <div>
            <label htmlFor="session-assignment" className="block text-sm font-medium text-slate-700">
              Mata pelajaran dan kelas
            </label>
            <select
              id="session-assignment"
              className={inputClass}
              aria-invalid={errors.assignmentId ? true : undefined}
              aria-describedby={errors.assignmentId ? 'session-assignment-error' : undefined}
              {...register('assignmentId')}
            >
              <option value="">Pilih penugasan</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.subject?.name} — {assignment.class?.name}
                </option>
              ))}
            </select>
            <FieldError id="session-assignment-error" message={errors.assignmentId?.message} />
          </div>

          <div>
            <label htmlFor="session-date" className="block text-sm font-medium text-slate-700">
              Tanggal sesi
            </label>
            <input
              id="session-date"
              type="date"
              className={inputClass}
              aria-invalid={errors.sessionDate ? true : undefined}
              aria-describedby={errors.sessionDate ? 'session-date-error' : undefined}
              {...register('sessionDate')}
            />
            <FieldError id="session-date-error" message={errors.sessionDate?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-start" className="block text-sm font-medium text-slate-700">
                Jam mulai
              </label>
              <input
                id="session-start"
                type="time"
                className={inputClass}
                aria-invalid={errors.start ? true : undefined}
                aria-describedby={errors.start ? 'session-start-error' : undefined}
                {...register('start')}
              />
              <FieldError id="session-start-error" message={errors.start?.message} />
            </div>
            <div>
              <label htmlFor="session-end" className="block text-sm font-medium text-slate-700">
                Jam selesai
              </label>
              <input
                id="session-end"
                type="time"
                className={inputClass}
                aria-invalid={errors.end ? true : undefined}
                aria-describedby={errors.end ? 'session-end-error' : undefined}
                {...register('end')}
              />
              <FieldError id="session-end-error" message={errors.end?.message} />
            </div>
          </div>

          <PrimaryButton type="submit" disabled={isSubmitting || assignments.length === 0}>
            {isSubmitting ? 'Membuat sesi…' : 'Buat sesi'}
          </PrimaryButton>
        </div>

        <aside
          aria-label="Detail penugasan terpilih"
          className="space-y-4 rounded-xl border border-black/10 bg-white p-5"
        >
          <h2 className="text-base font-bold text-ink-900">Detail sesi</h2>
          {selected ? (
            <div className="space-y-4">
              <DetailRow icon={MenuBookRoundedIcon} label="Mata pelajaran" value={selected.subject?.name ?? '—'} />
              <DetailRow
                icon={SchoolRoundedIcon}
                label="Kelas"
                value={[selected.class?.name, selected.class?.educationLevel?.name]
                  .filter(Boolean)
                  .join(' • ') || '—'}
              />
              <DetailRow icon={PersonOutlineRoundedIcon} label="Guru" value={teacherName ?? '—'} />
              <DetailRow icon={ScheduleRoundedIcon} label="Timezone" value={SCHOOL_TIMEZONE} />
            </div>
          ) : (
            <p className="text-sm text-slate-700">
              Pilih penugasan untuk melihat detail mata pelajaran dan kelas.
            </p>
          )}
          <p className="rounded-lg bg-blue-100 p-3 text-sm text-slate-700">
            Jendela absensi dibuka 15 menit sebelum jam mulai dan berakhir pada jam
            selesai. Status kehadiran ditentukan server saat siswa memindai.
          </p>
        </aside>
      </div>
    </form>
  )
}
