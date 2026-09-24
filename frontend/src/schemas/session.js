import { z } from 'zod'
import { SCHOOL_TIMEZONE, schoolDateTimeIso } from '../lib/dateTime'

// Validasi form awal saja; backend tetap memvalidasi assignment, timezone,
// rentang waktu, dan duplikasi (frontend/GUIDE.md section 2).
export const sessionFormSchema = z
  .object({
    assignmentId: z.string().min(1, 'Pilih mata pelajaran dan kelas.'),
    sessionDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format tanggal YYYY-MM-DD.'),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Jam mulai wajib diisi.'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'Jam selesai wajib diisi.'),
  })
  .refine((value) => value.end > value.start, {
    path: ['end'],
    message: 'Waktu selesai harus setelah waktu mulai.',
  })

// Payload mengikuti kontrak POST /attendance-sessions: ISO 8601 dengan offset
// timezone sekolah, ditambah timezone IANA. Tidak ada timestamp dari client
// selain waktu sesi yang dipilih pengguna.
export function toSessionPayload(values) {
  return {
    assignmentId: Number(values.assignmentId),
    sessionDate: values.sessionDate,
    startAt: schoolDateTimeIso(values.sessionDate, values.start),
    endAt: schoolDateTimeIso(values.sessionDate, values.end),
    timezone: SCHOOL_TIMEZONE,
  }
}
