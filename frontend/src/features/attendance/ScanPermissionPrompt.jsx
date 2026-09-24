import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import PrimaryButton from '../../components/common/PrimaryButton'

// Layar penjelas izin sebelum browser prompt kamera (docs/DESIGN_BRIEF.md 4.2).
// Kamera hanya diminta setelah aksi pengguna — tombol "Izinkan kamera".
export function ScanPermissionPrompt({ onAllow, onBack, onManual }) {
  return (
    <div
      role="region"
      aria-label="Izin kamera"
      className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-black/10 bg-white p-6 text-center"
    >
      <CameraAltRoundedIcon className="h-16! w-16! text-blue-500" />
      <h2 className="text-2xl font-bold text-ink-900">Akses kamera</h2>
      <p className="text-sm text-slate-700">
        SINTAS memerlukan izin kamera untuk memindai QR Code. Kamera hanya
        dinyalakan setelah Anda mengizinkan.
      </p>
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <HelpOutlineRoundedIcon className="h-4! w-4!" />
        Tanpa kamera? Gunakan kode manual dari guru.
      </p>

      <div className="flex flex-col gap-2 pt-2">
        <PrimaryButton type="button" onClick={onAllow} className="uppercase">
          Izinkan kamera
        </PrimaryButton>
        <button
          type="button"
          onClick={onManual}
          className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500"
        >
          Masukkan kode manual
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          Kembali
        </button>
      </div>
    </div>
  )
}
