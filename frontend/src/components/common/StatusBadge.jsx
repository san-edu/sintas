import CancelRounded from '@mui/icons-material/CancelRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import HourglassEmptyRounded from '@mui/icons-material/HourglassEmptyRounded'
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'

// Palet pill golden master (docs/DESIGN_BRIEF.md §3, PLAN_MERGE_UI §3):
// green Hadir, orange Belum dibuka/Terlambat, red Tidak Hadir, slate netral.
const TONE_CLASSES = {
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-orange-400/10 text-orange-700',
  danger: 'bg-red-500/10 text-red-500',
  info: 'bg-blue-100 text-blue-500',
  neutral: 'bg-black/5 text-slate-700',
}

const STATUS_ICONS = {
  HADIR: CheckCircleRounded,
  TERLAMBAT: ScheduleRounded,
  TIDAK_HADIR: CancelRounded,
  BISA_ABSEN: RadioButtonUncheckedRounded,
  BELUM_DIBUKA: HourglassEmptyRounded,
  SELESAI: ScheduleRounded,
}

// Status selalu ditampilkan dengan teks; warna/ikon hanya penguat
// (docs/DESIGN_BRIEF.md section 3 & 10, frontend/GUIDE.md section 7).
export function StatusBadge({ status, tone = 'neutral', icon, label }) {
  const Icon = icon ?? STATUS_ICONS[status] ?? null
  const text = label ?? status
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-radius-pill px-2.5 py-1 text-label-md ${TONE_CLASSES[tone] ?? TONE_CLASSES.neutral}`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      <span>{text}</span>
    </span>
  )
}