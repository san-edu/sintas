import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../../lib/errorMapping'
import { createUserSchema, toCreateUserPayload } from '../../../schemas/admin'
import { useCreateUser } from '../hooks/useAdminUsers'
import { useEducationLevels } from '../hooks/useAcademicMasters'
import { DialogShell, FieldError, inputClass } from './DialogShell'

const EMPTY_FORM = {
  username: '',
  password: '',
  role: 'STUDENT',
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  studentNumber: '',
  educationLevelId: '',
}

export function UserFormDialog({ open, onClose }) {
  const [rootError, setRootError] = useState(null)
  const createUser = useCreateUser()
  const { data: educationLevels } = useEducationLevels({ limit: 100 })
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: EMPTY_FORM,
  })

  const role = watch('role')

  const onSubmit = (values) => {
    setRootError(null)
    createUser
      .mutateAsync(toCreateUserPayload(values))
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
      title="Pengguna baru"
      description="Akun dibuat dengan password yang Anda isi; siswa mendapat nomor induk (NISN)."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {rootError}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">
              Peran
            </label>
            <select
              id="user-role"
              className={inputClass}
              {...register('role')}
            >
              <option value="STUDENT">Siswa</option>
              <option value="TEACHER">Guru</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="user-username" className="block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="user-username"
              className={inputClass}
              aria-invalid={errors.username ? true : undefined}
              aria-describedby={errors.username ? 'user-username-error' : undefined}
              {...register('username')}
            />
            <FieldError id="user-username-error" message={errors.username?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-slate-700">
            Nama lengkap
          </label>
          <input
            id="user-name"
            className={inputClass}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'user-name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="user-name-error" message={errors.name?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="user-password" className="block text-sm font-medium text-slate-700">
              Password awal
            </label>
            <input
              id="user-password"
              type="password"
              className={inputClass}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'user-password-error' : undefined}
              {...register('password')}
            />
            <FieldError id="user-password-error" message={errors.password?.message} />
          </div>
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              className={inputClass}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'user-email-error' : undefined}
              {...register('email')}
            />
            <FieldError id="user-email-error" message={errors.email?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="user-phone" className="block text-sm font-medium text-slate-700">
              Telepon
            </label>
            <input
              id="user-phone"
              className={inputClass}
              {...register('phone')}
            />
          </div>
          <div>
            <label htmlFor="user-birth" className="block text-sm font-medium text-slate-700">
              Tanggal lahir
            </label>
            <input
              id="user-birth"
              type="date"
              className={inputClass}
              {...register('birthDate')}
            />
          </div>
          <div>
            <label htmlFor="user-student-number" className="block text-sm font-medium text-slate-700">
              NISN (siswa)
            </label>
            <input
              id="user-student-number"
              className={inputClass}
              {...register('studentNumber')}
            />
          </div>
        </div>

        {role === 'STUDENT' && (
          <div>
            <label htmlFor="user-education-level" className="block text-sm font-medium text-slate-700">
              Jenjang (siswa)
            </label>
            <select
              id="user-education-level"
              className={inputClass}
              aria-invalid={errors.educationLevelId ? true : undefined}
              aria-describedby={errors.educationLevelId ? 'user-education-level-error' : undefined}
              {...register('educationLevelId')}
            >
              <option value="">Pilih jenjang</option>
              {educationLevels?.items?.map((level) => (
                <option key={level.id} value={String(level.id)}>
                  {level.name}
                </option>
              ))}
            </select>
            <FieldError id="user-education-level-error" message={errors.educationLevelId?.message} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createUser.isPending}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createUser.isPending ? 'Membuat…' : 'Buat pengguna'}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}