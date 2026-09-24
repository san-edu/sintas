import { z } from 'zod'
import { schoolDateTimeIso } from '../lib/dateTime'

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format tanggal YYYY-MM-DD.')
  .or(z.literal(''))

const datetimeField = z.string().or(z.literal(''))

export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul wajib diisi.').max(200),
    imageUrl: z
      .string()
      .trim()
      .url('Masukkan URL yang valid.')
      .max(500)
      .or(z.literal('')),
    content: z.string().trim().max(10000),
    isActive: z.boolean(),
    displayStartAt: datetimeField,
    displayEndAt: datetimeField,
  })
  .superRefine((value, context) => {
    if (!value.imageUrl && !value.content.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['content'],
        message: 'Banner harus memiliki gambar atau konten.',
      })
    }
    if (value.displayStartAt && value.displayEndAt && value.displayEndAt <= value.displayStartAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['displayEndAt'],
        message: 'Waktu akhir harus setelah waktu mulai.',
      })
    }
  })

export function toBannerPayload(values) {
  return {
    title: values.title,
    imageUrl: values.imageUrl || null,
    content: values.content.trim() || null,
    isActive: values.isActive,
    displayStartAt: toSchoolIso(values.displayStartAt),
    displayEndAt: toSchoolIso(values.displayEndAt),
  }
}

function toSchoolIso(value) {
  if (!value) return null
  const [date, time] = value.split('T')
  return schoolDateTimeIso(date, time) || null
}

export function bannerToForm(banner) {
  return {
    title: banner.title,
    imageUrl: banner.imageUrl ?? '',
    content: banner.content ?? '',
    isActive: banner.isActive,
    displayStartAt: toDatetimeLocal(banner.displayStartAt),
    displayEndAt: toDatetimeLocal(banner.displayEndAt),
  }
}

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const iso = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return iso.replace(' ', 'T')
}

export const createUserSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi.').max(100),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(128),
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(150),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  email: z
    .string()
    .trim()
    .email('Masukkan email yang valid.')
    .max(255)
    .or(z.literal('')),
  phone: z.string().trim().max(30),
  birthDate: dateField,
  studentNumber: z.string().trim().max(50),
  educationLevelId: z.string().trim().optional(),
}).superRefine((value, context) => {
  if (value.role === 'STUDENT' && !value.educationLevelId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['educationLevelId'],
      message: 'Pilih jenjang untuk siswa.',
    })
  }
})

export function toCreateUserPayload(values) {
  return {
    username: values.username,
    password: values.password,
    role: values.role,
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    birthDate: values.birthDate || null,
    ...(values.role === 'STUDENT' && values.studentNumber
      ? { studentNumber: values.studentNumber, educationLevelId: Number(values.educationLevelId) }
      : {}),
  }
}

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter.').max(128),
    passwordConfirmation: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passwordConfirmation'],
        message: 'Konfirmasi password tidak sama.',
      })
    }
  })

export const educationLevelSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(150),
})

export const classSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(100),
  educationLevelId: z.string().trim().min(1, 'Pilih jenjang.'),
})

export function toClassPayload(values) {
  return { name: values.name, educationLevelId: Number(values.educationLevelId) }
}

export const subjectSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(150),
})

export const reportFilterSchema = z.object({
  from: dateField,
  to: dateField,
  status: z.enum(['', 'HADIR', 'TERLAMBAT', 'TIDAK_HADIR']),
  classId: z.string().trim(),
})

export function reportFiltersToQuery(values) {
  return {
    from: values.from || undefined,
    to: values.to || undefined,
    status: values.status || undefined,
    classId: values.classId || undefined,
  }
}