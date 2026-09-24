import { z } from 'zod'

const password = z.string().min(8).max(128)

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password,
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255),
  birthDate: z.coerce.date(),
  password: password,
  passwordConfirmation: z.string(),
}).superRefine((value, context) => {
  if (value.password !== value.passwordConfirmation) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirmation'], message: 'Konfirmasi password tidak sama.' })
  }
})

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu field profil harus diisi.' })
