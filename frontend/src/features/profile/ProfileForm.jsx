import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUpdateProfile } from '../../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../../lib/errorMapping'
import { profileSchema, toProfilePayload } from '../../schemas/profile'

const inputClassName =
  'mt-1 w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-ink-900 focus:outline-none'

function dateToInputValue(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function FieldError({ id, message }) {
  return message ? <p id={id} className="mt-1 text-sm text-red-500">{message}</p> : null
}

export function ProfileForm({ user }) {
  const [saved, setSaved] = useState(false)
  const updateProfile = useUpdateProfile()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      birthDate: dateToInputValue(user?.birthDate),
    },
  })

  const onSubmit = (values) => {
    setSaved(false)
    updateProfile
      .mutateAsync(toProfilePayload(values))
      .then(() => setSaved(true))
      .catch((error) => {
        const entries = Object.entries(getFieldErrors(error))
        if (entries.length > 0) {
          entries.forEach(([name, messages]) =>
            setError(name, { type: 'server', message: messages[0] }),
          )
        } else {
          setError('root.server', {
            type: 'server',
            message: getErrorMessage(error),
          })
        }
      })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {saved ? (
        <p role="status" className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white">
          Profil berhasil disimpan.
        </p>
      ) : null}
      {errors.root?.server ? (
        <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
          {errors.root.server.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nama
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={inputClassName}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="name-error" message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            Nomor HP
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className={inputClassName}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            {...register('phone')}
          />
          <FieldError id="phone-error" message={errors.phone?.message} />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700">
            Tanggal lahir
          </label>
          <input
            id="birthDate"
            type="date"
            autoComplete="bday"
            className={inputClassName}
            aria-invalid={errors.birthDate ? true : undefined}
            aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
            {...register('birthDate')}
          />
          <FieldError id="birthDate-error" message={errors.birthDate?.message} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting}
          className="rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500 disabled:opacity-50"
        >
          Batalkan
        </button>
      </div>
    </form>
  )
}
