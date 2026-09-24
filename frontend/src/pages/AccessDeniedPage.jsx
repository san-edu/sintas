import { Link } from 'react-router-dom'

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-heading-lg font-bold text-ink-900">Akses ditolak</h1>
      <p className="mt-2 text-body-md text-ink-700">
        Peran Anda tidak memiliki akses ke halaman ini.
      </p>
      <Link
        to="/app"
        className="mt-4 inline-block rounded-radius-md bg-school-blue-700 px-4 py-2.5 text-label-md text-white"
      >
        Kembali ke beranda
      </Link>
    </main>
  )
}