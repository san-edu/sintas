import { AppError } from '../middleware/errorHandler.js'

export function assertTimezone(timezone, expectedTimezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
  } catch {
    throw new AppError(400, 'INVALID_TIMEZONE', 'Timezone tidak valid.', { timezone: 'Gunakan timezone IANA yang valid.' })
  }
  if (timezone !== expectedTimezone) {
    throw new AppError(400, 'INVALID_TIMEZONE', 'Timezone harus sesuai timezone sekolah.', { timezone: 'Timezone tidak sesuai konfigurasi sekolah.' })
  }
}

export function localDate(value, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
  return parts.reduce((result, part) => (part.type === 'year' || part.type === 'month' || part.type === 'day' ? { ...result, [part.type]: part.value } : result), {})
}

export function normalizeSessionTimes({ sessionDate, startAt, endAt, timezone }, expectedTimezone) {
  assertTimezone(timezone, expectedTimezone)
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    throw new AppError(400, 'INVALID_DATETIME', 'Waktu sesi tidak valid.')
  }
  if (end <= start) {
    throw new AppError(400, 'INVALID_TIME_RANGE', 'Waktu selesai harus setelah waktu mulai.', { endAt: 'Harus lebih besar dari startAt.' })
  }
  const startDate = localDate(start, timezone)
  const endDate = localDate(end, timezone)
  const expectedDate = `${startDate.year}-${startDate.month}-${startDate.day}`
  if (sessionDate !== expectedDate || `${endDate.year}-${endDate.month}-${endDate.day}` !== sessionDate) {
    throw new AppError(400, 'INVALID_SESSION_DATE', 'Tanggal sesi harus sesuai tanggal lokal waktu sesi.', { sessionDate: 'Tidak sesuai timezone sekolah.' })
  }
  return { sessionDate: new Date(`${sessionDate}T00:00:00.000Z`), startAt: start, endAt: end }
}