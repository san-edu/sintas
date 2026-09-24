import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import { CAMERA_STATUS } from './cameraPermission'

// State gagal kamera (docs/PROMPT_GUIDE.md F3): setiap kegagalan menyediakan
// jalan keluar — kode manual, coba lagi, atau kembali.
export function ScanCameraFallback({ camera, onRetry, onManual, onBack }) {
  if (
    camera !== CAMERA_STATUS.DENIED &&
    camera !== CAMERA_STATUS.UNAVAILABLE &&
    camera !== CAMERA_STATUS.ERROR
  ) {
    return null
  }

  const isDenied = camera === CAMERA_STATUS.DENIED
  const config = isDenied
    ? {
        icon: CameraAltRoundedIcon,
        title: 'Akses kamera ditolak',
        message:
          'Izinkan akses kamera di pengaturan browser untuk memindai, atau gunakan kode manual.',
      }
    : camera === CAMERA_STATUS.UNAVAILABLE
      ? {
          icon: CameraAltRoundedIcon,
          title: 'Kamera tidak tersedia',
          message:
            'Perangkat ini tidak memiliki kamera yang bisa digunakan. Gunakan kode manual dari guru.',
        }
      : {
          icon: ErrorRoundedIcon,
          title: 'Kamera gagal dinyalakan',
          message: 'Coba nyalakan kamera lagi, atau gunakan kode manual.',
        }
  const Icon = config.icon

  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-black/10 bg-white p-6 text-center"
    >
      <Icon className="h-16! w-16! text-red-500" />
      <h3 className="text-xl font-bold text-ink-900">{config.title}</h3>
      <p className="text-sm text-slate-700">{config.message}</p>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onManual}
          className="flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white uppercase"
        >
          Masukkan kode manual
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="flex w-full items-center justify-center rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-500"
        >
          Coba lagi
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
