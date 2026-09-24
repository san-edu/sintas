// Label UI untuk status absensi dan window sesi. Sumber kebenaran tetap enum
// dari API; pemetaan ini hanya untuk tampilan (frontend/GUIDE.md section 6).
export const ATTENDANCE_STATUS_LABELS = Object.freeze({
  HADIR: 'Hadir',
  TERLAMBAT: 'Terlambat',
  TIDAK_HADIR: 'Tidak Hadir',
})

export const WINDOW_STATUS_LABELS = Object.freeze({
  BELUM_DIBUKA: 'Belum dibuka',
  BISA_ABSEN: 'Bisa absen',
  SELESAI: 'Selesai',
})

export function attendanceStatusLabel(status) {
  return ATTENDANCE_STATUS_LABELS[status] ?? null
}

export function windowStatusLabel(status) {
  return WINDOW_STATUS_LABELS[status] ?? null
}

export const HISTORY_STATUS_OPTIONS = Object.freeze([
  { value: '', label: 'Semua status' },
  { value: 'HADIR', label: 'Hadir' },
  { value: 'TERLAMBAT', label: 'Terlambat' },
  { value: 'TIDAK_HADIR', label: 'Tidak Hadir' },
])

// Tone visual dipasangkan dengan teks; warna tidak pernah jadi satu-satunya
// pembawa makna (docs/DESIGN_BRIEF.md).
export const ATTENDANCE_STATUS_TONES = Object.freeze({
  HADIR: 'success',
  TERLAMBAT: 'warning',
  TIDAK_HADIR: 'danger',
})

// Tone mengikuti golden master JadwalCard: Bisa absen hijau, Belum dibuka
// oranye, Selesai slate (PLAN_MERGE_UI §3 invariant #6/#7). Hanya tampilan.
export const WINDOW_STATUS_TONES = Object.freeze({
  BELUM_DIBUKA: 'warning',
  BISA_ABSEN: 'success',
  SELESAI: 'neutral',
})

export function attendanceStatusTone(status) {
  return ATTENDANCE_STATUS_TONES[status] ?? 'neutral'
}

export function windowStatusTone(status) {
  return WINDOW_STATUS_TONES[status] ?? 'neutral'
}