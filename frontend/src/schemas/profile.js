import { z } from 'zod'

// Feedback awal saja; backend tetap memvalidasi ulang (frontend/GUIDE.md).
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama wajib diisi.')
    .max(150, 'Nama maksimal 150 karakter.'),
  email: z
    .string()
    .trim()
    .max(255, 'Email maksimal 255 karakter.')
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Email tidak valid.',
    ),
  phone: z.string().trim().max(30, 'Nomor HP maksimal 30 karakter.'),
  birthDate: z
    .string()
    .refine(
      (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
      'Gunakan format tanggal YYYY-MM-DD.',
    ),
})

export function toProfilePayload(values) {
  return {
    name: values.name.trim(),
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    birthDate: values.birthDate || null,
  }
}