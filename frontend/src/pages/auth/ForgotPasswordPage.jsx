import { zodResolver } from '@hookform/resolvers/zod'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PrimaryButton from '../../components/common/PrimaryButton'
import ContentShell from '../../components/layout/ContentShell'
import { useAuthForgotPassword } from '../../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../../lib/errorMapping'
import { roleHome } from '../../lib/permissions'
import { forgotPasswordSchema } from '../../schemas/auth'
import { useSessionStore } from '../../stores/sessionStore'

const inputClassName =
  'text-black bg-white w-full px-4 py-2 focus:outline-none rounded-lg'

// Layar pemulihan memakai pola login golden master (biru penuh + input putih +
// CTA orange uppercase). Alur forgot-password tetap milik service/React Query.
export default function ForgotPasswordPage() {
  const user = useSessionStore((state) => state.user)
  const forgotPassword = useAuthForgotPassword()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      birthDate: '',
      password: '',
      passwordConfirmation: '',
    },
  })

  if (user) return <Navigate to={roleHome(user.role)} replace />

  const onSubmit = (values) => {
    forgotPassword.mutateAsync(values).catch((error) => {
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
    <main className="min-h-dvh bg-blue-500 text-white flex items-center py-12">
      <ContentShell>
        <div className="text-center">
          <LockResetRoundedIcon className="w-16! h-16!" />
          <h1 className="mt-2 text-3xl font-bold">Pulihkan password</h1>
          <p className="mt-2 text-sm text-white/90">
            Masukkan email dan tanggal lahir yang terdaftar, lalu tetapkan
            password baru.
          </p>
        </div>

        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {errors.root?.server ? (
            <p
              role="alert"
              className="w-full rounded-lg bg-red-500 px-3 py-2 text-sm"
            >
              {errors.root.server.message}
            </p>
          ) : null}

          <div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-label="Email"
              placeholder="Email"
              className={inputClassName}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="email-error" className="mt-1 text-sm text-white">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <input
              id="birthDate"
              type="date"
              autoComplete="bday"
              aria-label="Tanggal lahir"
              className={inputClassName}
              aria-invalid={errors.birthDate ? true : undefined}
              aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
              {...register('birthDate')}
            />
            {errors.birthDate ? (
              <p id="birthDate-error" className="mt-1 text-sm text-white">
                {errors.birthDate.message}
              </p>
            ) : null}
          </div>

          <div>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-label="Password baru"
              placeholder="Password baru"
              className={inputClassName}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" className="mt-1 text-sm text-white">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div>
            <input
              id="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              aria-label="Konfirmasi password"
              placeholder="Konfirmasi password"
              className={inputClassName}
              aria-invalid={errors.passwordConfirmation ? true : undefined}
              aria-describedby={
                errors.passwordConfirmation
                  ? 'passwordConfirmation-error'
                  : undefined
              }
              {...register('passwordConfirmation')}
            />
            {errors.passwordConfirmation ? (
              <p id="passwordConfirmation-error" className="mt-1 text-sm text-white">
                {errors.passwordConfirmation.message}
              </p>
            ) : null}
          </div>

          <PrimaryButton
            type="submit"
            disabled={isSubmitting || forgotPassword.isPending}
            className="bg-orange-400 uppercase"
          >
            {isSubmitting ? 'Mengirim…' : 'Kirim'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-semibold text-white underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </ContentShell>
    </main>
  )
}
