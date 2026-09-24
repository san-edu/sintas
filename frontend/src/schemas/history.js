import { z } from 'zod'

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format tanggal YYYY-MM-DD.')
  .or(z.literal(''))

export const historyFilterSchema = z
  .object({
    from: dateField,
    to: dateField,
    status: z.enum(['', 'HADIR', 'TERLAMBAT', 'TIDAK_HADIR']),
  })
  .superRefine((value, context) => {
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'Tanggal akhir harus setelah tanggal mulai.',
      })
    }
  })