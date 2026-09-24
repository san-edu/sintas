import { formatSchoolDateTime } from '../../../lib/dateTime'
import { StatusBadge } from '../../../components/common/StatusBadge'

function BannerPeriod({ banner }) {
  const start = formatSchoolDateTime(banner.displayStartAt)
  const end = formatSchoolDateTime(banner.displayEndAt)
  if (!start && !end) return 'Selalu'
  if (start && end) return `${start} — ${end}`
  return `${start || 'sekarang'} — ${end || 'selesai'}`
}

export function BannerMobileList({ items, onEdit, onDelete }) {
  return (
    <ul className="space-y-3 sm:hidden">
      {items.map((banner) => (
        <li key={banner.id}>
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <span className="flex items-start justify-between gap-3">
              <span className="block font-semibold text-ink-900">{banner.title}</span>
              <StatusBadge
                status={banner.isActive ? 'Aktif' : 'Nonaktif'}
                tone={banner.isActive ? 'success' : 'neutral'}
              />
            </span>
            <span className="mt-1 block text-xs text-slate-700">
              {banner.content && !banner.imageUrl ? banner.content : banner.imageUrl ?? 'Tanpa konten'}
            </span>
            <span className="mt-1 block text-xs text-slate-700">
              Tampil: <BannerPeriod banner={banner} />
            </span>
            <span className="mt-2 block">
              <button
                type="button"
                onClick={() => onEdit(banner)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
              >
                Ubah
              </button>
              <button
                type="button"
                onClick={() => onDelete(banner)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-danger-700 hover:bg-danger-700/10"
              >
                Hapus
              </button>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function BannerDesktopTable({ items, onEdit, onDelete }) {
  return (
    <div className="hidden overflow-x-auto rounded-lg border border-black/10 bg-white sm:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Daftar banner sekolah</caption>
        <thead className="border-b border-black/10 text-slate-700">
          <tr>
            <th scope="col" className="p-3 font-semibold">Judul</th>
            <th scope="col" className="p-3 font-semibold">Konten</th>
            <th scope="col" className="p-3 font-semibold">Periode tampil</th>
            <th scope="col" className="p-3 font-semibold">Status</th>
            <th scope="col" className="sr-only p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((banner) => (
            <tr key={banner.id} className="border-b border-black/5 last:border-b-0">
              <td className="p-3 font-semibold text-ink-900">{banner.title}</td>
              <td className="max-w-xs p-3 text-slate-700">
                <span className="block truncate">
                  {banner.content && !banner.imageUrl ? banner.content : banner.imageUrl ?? '—'}
                </span>
              </td>
              <td className="p-3 text-slate-700">
                <BannerPeriod banner={banner} />
              </td>
              <td className="p-3">
                <StatusBadge
                  status={banner.isActive ? 'Aktif' : 'Nonaktif'}
                  tone={banner.isActive ? 'success' : 'neutral'}
                />
              </td>
              <td className="p-3 text-right">
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(banner)}
                    className="rounded-lg px-2 py-1 text-sm font-semibold text-blue-500 hover:bg-blue-100/50"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(banner)}
                    className="rounded-lg px-2 py-1 text-sm font-semibold text-danger-700 hover:bg-danger-700/10"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
