import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../../lib/errorMapping'
import { membershipFormSchema, toMembershipPayload } from '../../../schemas/admin'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useClasses } from '../hooks/useAcademicMasters'
import { useCreateMembership } from '../hooks/usePlotting'
import { DialogShell, FieldError, inputClass } from './DialogShell'

export function MembershipFormDialog({ open, onClose }) {
  const [rootError, setRootError] = useState(null)
  const createMembership = useCreateMembership()
  const studentsQuery = useAdminUsers({ page: 1, limit: 100, role: 'STUDENT' })
  const classesQuery = useClasses({ page: 1, limit: 100 })
  const students = studentsQuery.data?.items ?? []
  const classes = classesQuery.data?.items ?? []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: { classId: '', studentId: '' },
  })

  const onSubmit = (values) => {
    setRootError(null)
    createMembership
      .mutateAsync(toMembershipPayload(values))
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
      title="Tambah penempatan siswa"
      description="Tempatkan siswa pada satu kelas aktif."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {rootError}
          </p>
        ) : null}

        <div>
          <label htmlFor="membership-form-student" className="block text-sm font-medium text-slate-700">
            Siswa
          </label>
          <select
            id="membership-form-student"
            className={inputClass}
            aria-invalid={errors.studentId ? true : undefined}
            aria-describedby={errors.studentId ? 'membership-form-student-error' : undefined}
            {...register('studentId')}
          >
            <option value="">Pilih siswa</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          <FieldError id="membership-form-student-error" message={errors.studentId?.message} />
        </div>

        <div>
          <label htmlFor="membership-form-class" className="block text-sm font-medium text-slate-700">
            Kelas
          </label>
          <select
            id="membership-form-class"
            className={inputClass}
            aria-invalid={errors.classId ? true : undefined}
            aria-describedby={errors.classId ? 'membership-form-class-error' : undefined}
            {...register('classId')}
          >
            <option value="">Pilih kelas</option>
            {classes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
          <FieldError id="membership-form-class-error" message={errors.classId?.message} />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createMembership.isPending}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createMembership.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createMembership.isPending ? 'Menyimpan…' : 'Tambah penempatan'}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
