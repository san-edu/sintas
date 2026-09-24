import { zodResolver } from '@hookform/resolvers/zod'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import PrimaryButton from '../../components/common/PrimaryButton'
import ContentShell from '../../components/layout/ContentShell'
import { useAuthLogin } from '../../hooks/useAuth'
import { getErrorMessage, getFieldErrors } from '../../lib/errorMapping'
import { roleHome } from '../../lib/permissions'
import { loginSchema } from '../../schemas/auth'
import { useSessionStore } from '../../stores/sessionStore'

const inputClassName =
  'text-black bg-white w-full px-4 py-2 focus:outline-none rounded-lg'

// Layout mengikuti golden master `features/login/Login.tsx` (PLAN_MERGE_UI §3):
// layar biru penuh, ikon + judul aplikasi, form input putih, CTA orange
// uppercase. Hanya presentasi — alur login tetap lewat React Query/service.
export default function LoginPage() {
  const location = useLocation()
  const [passwordReset] = useState(() => Boolean(location.state?.passwordReset))
  const user = useSessionStore((state) => state.user)
  const sessionExpired = useSessionStore((state) => state.sessionExpired)
  const login = useAuthLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  if (user) return <Navigate to={roleHome(user.role)} replace />

  const onSubmit = (values) => {
    login.mutateAsync(values).catch((error) => {
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
    <main className="min-h-dvh bg-blue-500 text-white flex items-center pb-32">
      <ContentShell>
        <div className="text-center">
          <MenuBookRoundedIcon className="w-16! h-16!" />
          <p className="text-6xl font-bold">SINTAS</p>
        </div>

        <form
          className="mt-12 flex flex-col items-center gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <h1 className="text-2xl font-semibold">Masuk</h1>

          {sessionExpired ? (
            <p
              role="status"
              className="w-full rounded-lg bg-white/15 px-3 py-2 text-sm"
            >
              Sesi Anda berakhir. Silakan masuk kembali.
            </p>
          ) : null}
          {passwordReset ? (
            <p
              role="status"
              className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm"
            >
              Password berhasil diubah. Silakan masuk kembali.
            </p>
          ) : null}
          {errors.root?.server ? (
            <p
              role="alert"
              className="w-full rounded-lg bg-red-500 px-3 py-2 text-sm"
            >
              {errors.root.server.message}
            </p>
          ) : null}

          <div className="w-full">
            <input
              id="username"
              type="text"
              autoComplete="username"
              aria-label="Username"
              placeholder="Username"
              className={inputClassName}
              aria-invalid={errors.username ? true : undefined}
              aria-describedby={errors.username ? 'username-error' : undefined}
              {...register('username')}
            />
            {errors.username ? (
              <p id="username-error" className="mt-1 text-left text-sm text-white">
                {errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="w-full">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-label="Password"
              placeholder="Password"
              className={inputClassName}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" className="mt-1 text-left text-sm text-white">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-400 uppercase"
          >
            {isSubmitting ? 'Memproses…' : 'Masuk'}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="font-semibold text-white underline">
            Lupa password?
          </Link>
        </p>
      </ContentShell>
    </main>
  )
}
