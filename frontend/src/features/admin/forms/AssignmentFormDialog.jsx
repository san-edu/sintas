import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../../lib/errorMapping'
import { assignmentFormSchema, toAssignmentPayload } from '../../../schemas/admin'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useClasses, useSubjects } from '../hooks/useAcademicMasters'
import { useCreateAssignment } from '../hooks/usePlotting'
import { DialogShell, FieldError, inputClass } from './DialogShell'

export function AssignmentFormDialog({ open, onClose }) {
  const [rootError, setRootError] = useState(null)
  const createAssignment = useCreateAssignment()
  const teachersQuery = useAdminUsers({ page: 1, limit: 100, role: 'TEACHER' })
  const classesQuery = useClasses({ page: 1, limit: 100 })
  const subjectsQuery = useSubjects({ page: 1, limit: 100 })
  const teachers = teachersQuery.data?.items ?? []
  const classes = classesQuery.data?.items ?? []
  const subjects = subjectsQuery.data?.items ?? []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: { teacherId: '', classId: '', subjectId: '' },
  })

  const onSubmit = (values) => {
    setRootError(null)
    createAssignment
      .mutateAsync(toAssignmentPayload(values))
      .then(() => onClose())
      .catch((error) => {
        const entries = Object.entries(getFieldErrors(error))
        if (entries.length === 0) setRootError(getErrorMessage(error))
        else setRootError(entries.map(([, messages]) => messages[0]).join(' '))
      })
  }

  return (
    <DialogShell
      open={open}
      title="Tambah penugasan guru"
      description="Tempatkan guru pada kelas dan mata pelajaran."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {rootError}
          </p>
        ) : null}

        <div>
          <label htmlFor="assignment-teacher" className="block text-sm font-medium text-slate-700">
            Guru
          </label>
          <select
            id="assignment-teacher"
            className={inputClass}
            aria-invalid={errors.teacherId ? true : undefined}
            aria-describedby={errors.teacherId ? 'assignment-teacher-error' : undefined}
            {...register('teacherId')}
          >
            <option value="">Pilih guru</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <FieldError id="assignment-teacher-error" message={errors.teacherId?.message} />
        </div>

        <div>
          <label htmlFor="assignment-class" className="block text-sm font-medium text-slate-700">
            Kelas
          </label>
          <select
            id="assignment-class"
            className={inputClass}
            aria-invalid={errors.classId ? true : undefined}
            aria-describedby={errors.classId ? 'assignment-class-error' : undefined}
            {...register('classId')}
          >
            <option value="">Pilih kelas</option>
            {classes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <FieldError id="assignment-class-error" message={errors.classId?.message} />
        </div>

        <div>
          <label htmlFor="assignment-subject" className="block text-sm font-medium text-slate-700">
            Mata pelajaran
          </label>
          <select
            id="assignment-subject"
            className={inputClass}
            aria-invalid={errors.subjectId ? true : undefined}
            aria-describedby={errors.subjectId ? 'assignment-subject-error' : undefined}
            {...register('subjectId')}
          >
            <option value="">Pilih mata pelajaran</option>
            {subjects.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <FieldError id="assignment-subject-error" message={errors.subjectId?.message} />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createAssignment.isPending}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createAssignment.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createAssignment.isPending ? 'Menyimpan…' : 'Tambah penugasan'}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
