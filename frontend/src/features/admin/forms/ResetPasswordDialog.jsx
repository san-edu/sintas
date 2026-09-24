import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage, getFieldErrors } from '../../../lib/errorMapping'
import { resetPasswordSchema } from '../../../schemas/admin'
import { useResetUserPassword } from '../hooks/useAdminUsers'
import { DialogShell, FieldError, inputClass } from './DialogShell'

const EMPTY_FORM = { password: '', passwordConfirmation: '' }

export function ResetPasswordDialog({ open, user, onClose }) {
  const [rootError, setRootError] = useState(null)
  const resetPassword = useResetUserPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: EMPTY_FORM,
  })

  const onSubmit = (values) => {
    setRootError(null)
    resetPassword
      .mutateAsync({
        id: user.id,
        data: { password: values.password, passwordConfirmation: values.passwordConfirmation },
      })
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
      title={`Reset password ${user?.name ?? ''}`}
      description="Password baru menggantikan password akun sebelumnya. Beritahu pengguna secara aman."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">
            {rootError}
          </p>
        ) : null}

        <div>
          <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700">
            Password baru
          </label>
          <input
            id="reset-password"
            type="password"
            className={inputClass}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'reset-password-error' : undefined}
            {...register('password')}
          />
          <FieldError id="reset-password-error" message={errors.password?.message} />
        </div>

        <div>
          <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-slate-700">
            Konfirmasi password
          </label>
          <input
            id="reset-password-confirm"
            type="password"
            className={inputClass}
            aria-invalid={errors.passwordConfirmation ? true : undefined}
            aria-describedby={errors.passwordConfirmation ? 'reset-password-confirm-error' : undefined}
            {...register('passwordConfirmation')}
          />
          <FieldError id="reset-password-confirm-error" message={errors.passwordConfirmation?.message} />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={resetPassword.isPending}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={resetPassword.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {resetPassword.isPending ? 'Memproses…' : 'Reset password'}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}