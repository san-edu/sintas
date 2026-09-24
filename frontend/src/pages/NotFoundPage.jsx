import { Link } from 'react-router-dom'
import ContentShell from '../components/layout/ContentShell'

// Layout mengikuti golden master `pages/NotFound.tsx`: layar biru penuh dengan
// teks putih terpusat + 404. Link jalan keluar ditambahkan agar tidak menjadi
// layar buntu (DESIGN_BRIEF §1.2 principle 2).
export default function NotFoundPage() {
  return (
    <main className="min-h-dvh bg-blue-500">
      <ContentShell className="flex min-h-dvh flex-col items-center justify-center gap-1 text-center text-white">
        <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
        <p className="text-4xl font-bold">404</p>
        <Link
          to="/app"
          className="mt-6 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white"
        >
          Kembali ke beranda
        </Link>
      </ContentShell>
    </main>
  )
}
