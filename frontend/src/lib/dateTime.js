export const SCHOOL_TIMEZONE =
  import.meta.env.VITE_SCHOOL_TIMEZONE ?? 'Asia/Jakarta'

function formatter(options) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: SCHOOL_TIMEZONE,
    ...options,
  })
}

export function formatSchoolDate(value) {
  if (!value) return ''
  return formatter({ dateStyle: 'medium' }).format(new Date(value))
}

export function formatSchoolTime(value) {
  if (!value) return ''
  return formatter({ timeStyle: 'short' }).format(new Date(value))
}

export function formatSchoolDateTime(value) {
  if (!value) return ''
  return formatter({ dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

export function formatSchoolDateLong(value) {
  if (!value) return ''
  return formatter({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

// Tanggal kalender sekolah (timezone sekolah) sebagai YYYY-MM-DD, bukan waktu
// lokal browser. Dipakai untuk default filter dan label tanggal display.
export function schoolDateString(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHOOL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function todaySchoolDate() {
  return schoolDateString(new Date())
}

export function schoolDateOffset(days) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHOOL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const offsetDate = new Date(
    Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day) + days),
  )
  return schoolDateString(offsetDate)
}

// Offset timezone sekolah (menit) terhadap UTC pada tanggal tertentu.
// Dipakai untuk membentuk ISO 8601 dengan offset yang benar dari input jam
// kalender sekolah; tidak memakai jam lokal browser.
function timezoneOffsetMinutes(timeZone, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  )
  return Math.round((asUtc - date.getTime()) / 60000)
}

function offsetString(minutes) {
  const sign = minutes >= 0 ? '+' : '-'
  const absolute = Math.abs(minutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const mins = String(absolute % 60).padStart(2, '0')
  return `${sign}${hours}:${mins}`
}

// Menggabungkan tanggal kalender sekolah (YYYY-MM-DD) dan jam (HH:mm) menjadi
// ISO 8601 dengan offset timezone sekolah, sesuai kontrak POST
// /attendance-sessions. Backend tetap menormalisasi ke UTC dan memvalidasi
// timezone serta sessionDate.
export function schoolDateTimeIso(sessionDate, time) {
  if (!sessionDate || !time) return ''
  const [year, month, day] = sessionDate.split('-').map(Number)
  const approx = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const offset = timezoneOffsetMinutes(SCHOOL_TIMEZONE, approx)
  return `${sessionDate}T${time}:00${offsetString(offset)}`
}