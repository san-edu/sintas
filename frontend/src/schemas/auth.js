import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi.').max(100),
  password: z.string().min(1, 'Password wajib diisi.').max(128),
})

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email('Email tidak valid.').max(255),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format tanggal YYYY-MM-DD.'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter.')
      .max(128, 'Password maksimal 128 karakter.'),
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'Konfirmasi password tidak sama.',
  })