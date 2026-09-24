// Navigasi halaman untuk tabel ter-paginasi; pola sama dengan halaman
// riwayat siswa agar perilaku keyboard dan label konsisten.
export function Pagination({ page, totalPages, total, label = 'Daftar', onChange }) {
  const max = totalPages || 1
  return (
    <nav
      aria-label={`Navigasi halaman ${label}`}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-slate-700" aria-live="polite">
        {total} entri.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span className="text-sm text-slate-700">
          Halaman {page} dari {max}
        </span>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= max}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-100/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </nav>
  )
}
