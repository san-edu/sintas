import { z } from 'zod'

const id = z.coerce.number().int().positive()
const name = z.string().trim().min(1).max(150)
const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'createdAt']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
}).strict()

export const listAcademicSchema = pagination.extend({
  educationLevelId: id.optional(),
  name: z.string().trim().max(150).optional(),
}).strict()

export const educationLevelSchema = z.object({ name }).strict()
export const classSchema = z.object({ name, educationLevelId: id }).strict()
export const subjectSchema = z.object({ name }).strict()
export const userListSchema = pagination.extend({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
  search: z.string().trim().max(100).optional(),
}).strict()

export const createUserSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(128),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(255).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  studentNumber: z.string().trim().min(1).max(50).optional(),
  educationLevelId: id.optional(),
}).strict()

export const resetUserPasswordSchema = z.object({
  password: z.string().min(8).max(128),
  passwordConfirmation: z.string(),
}).strict().superRefine((value, context) => {
  if (value.password !== value.passwordConfirmation) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirmation'], message: 'Konfirmasi password tidak sama.' })
  }
})

// Listing admin untuk penempatan/penugasan (read-only, scope ADMIN). Sort
// dibatasi ke `createdAt`; filter opsional membatasi scope tabel sesuai
// docs/API_CONTRACT.md.
export const membershipListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  classId: id.optional(),
}).strict()

export const assignmentListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  teacherId: id.optional(),
}).strict()

export const membershipSchema = z.object({ classId: id, studentId: id }).strict()
export const assignmentSchema = z.object({ teacherId: id, classId: id, subjectId: id }).strict()
export const statusSchema = z.object({ isActive: z.boolean() }).strict()
