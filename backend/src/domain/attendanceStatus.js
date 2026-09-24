import { z } from 'zod'

const SCAN_WINDOW_MINUTES = 15
const MINUTE_IN_MS = 60 * 1000

export const AttendanceStatus = Object.freeze({
  HADIR: 'HADIR',
  TERLAMBAT: 'TERLAMBAT',
  TIDAK_HADIR: 'TIDAK_HADIR',
})

export const ScheduleWindowStatus = Object.freeze({
  BELUM_DIBUKA: 'BELUM_DIBUKA',
  BISA_ABSEN: 'BISA_ABSEN',
  SELESAI: 'SELESAI',
})

export const attendanceSessionSchema = z.object({
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
}).superRefine(({ startAt, endAt }, context) => {
  if (endAt <= startAt) {
    context.addIssue({
      code: 'custom',
      path: ['endAt'],
      message: 'endAt harus setelah startAt.',
    })
  }
})

export function validateAttendanceSession(session) {
  return attendanceSessionSchema.parse(session)
}

export function classifyAttendanceScan({ startAt, endAt, scanAt }) {
  const session = validateAttendanceSession({ startAt, endAt })
  const scannedAt = z.coerce.date().parse(scanAt)
  const windowStart = new Date(session.startAt.getTime() - SCAN_WINDOW_MINUTES * MINUTE_IN_MS)
  const presentUntil = new Date(session.startAt.getTime() + SCAN_WINDOW_MINUTES * MINUTE_IN_MS)

  if (scannedAt < windowStart || scannedAt > session.endAt) {
    throw new RangeError('Waktu scan berada di luar jendela absensi.')
  }

  if (scannedAt <= presentUntil) {
    return { status: AttendanceStatus.HADIR, lateMinutes: 0 }
  }

  return {
    status: AttendanceStatus.TERLAMBAT,
    lateMinutes: Math.floor((scannedAt.getTime() - session.startAt.getTime()) / MINUTE_IN_MS),
  }
}

export function classifyScheduleItem({ startAt, endAt, now, record = null }) {
  const session = validateAttendanceSession({ startAt, endAt })
  const timestamp = z.coerce.date().parse(now)
  const windowStart = new Date(session.startAt.getTime() - SCAN_WINDOW_MINUTES * MINUTE_IN_MS)

  let windowStatus
  if (timestamp < windowStart) windowStatus = ScheduleWindowStatus.BELUM_DIBUKA
  else if (timestamp <= session.endAt) windowStatus = ScheduleWindowStatus.BISA_ABSEN
  else windowStatus = ScheduleWindowStatus.SELESAI

  const recordStatus = record?.status ?? null
  const attendanceStatus = recordStatus ?? (timestamp > session.endAt ? AttendanceStatus.TIDAK_HADIR : null)

  return {
    windowStatus,
    attendanceStatus,
    scanned: Boolean(record),
  }
}