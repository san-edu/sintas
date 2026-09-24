import argon2 from 'argon2'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.js'
import { isOpaqueQrPayload } from '../../src/domain/attendanceQr.js'

const env = {
  NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5173', JWT_SECRET: 'test-secret-that-is-long-enough-for-jwt', JWT_ISSUER: 'sintas-test', ACCESS_TOKEN_TTL: '15m', AUTH_COOKIE_NAME: 'auth_token', SCHOOL_TIMEZONE: 'Asia/Jakarta',
}
const passwordHash = await argon2.hash('password-123', { type: argon2.argon2id })
const users = [
  { id: 1, username: 'admin', passwordHash, role: 'ADMIN', name: 'Admin', email: 'admin@test.local', studentProfile: null },
  { id: 2, username: 'teacher', passwordHash, role: 'TEACHER', name: 'Teacher', email: 'teacher@test.local', studentProfile: null },
  { id: 3, username: 'student', passwordHash, role: 'STUDENT', name: 'Student', email: 'student@test.local', studentProfile: { studentNumber: 'S-1' } },
  { id: 4, username: 'other-teacher', passwordHash, role: 'TEACHER', name: 'Other Teacher', email: 'other@test.local', studentProfile: null },
]

function createPrisma() {
  const sessions = []
  const assignment = { id: 60, teacherId: 2, classId: 30, subjectId: 40, isActive: true, class: { id: 30, name: 'X IPA 1' }, subject: { id: 40, name: 'Math' } }
  const prisma = {
    user: {
      findUnique: vi.fn(({ where }) => Promise.resolve(users.find((value) => value.id === where.id || value.username === where.username) ?? null)),
      findFirst: vi.fn(({ where }) => Promise.resolve(users.find((value) => value.id === where.id && value.role === where.role) ?? null)),
    },
    teacherAssignment: {
      findFirst: vi.fn(({ where }) => Promise.resolve(where.teacherId === assignment.teacherId && where.id === assignment.id && where.isActive ? assignment : null)),
    },
    attendanceSession: {
      create: vi.fn(({ data }) => {
        if (sessions.some((value) => value.assignmentId === data.assignmentId && value.sessionDate.valueOf() === data.sessionDate.valueOf() && value.startAt.valueOf() === data.startAt.valueOf() && value.endAt.valueOf() === data.endAt.valueOf())) {
          return Promise.reject({ code: 'P2002' })
        }
        const session = { ...data, id: sessions.length + 1, createdAt: new Date(), assignment, class: assignment.class }
        sessions.push(session)
        return Promise.resolve(session)
      }),
      findMany: vi.fn(({ where }) => Promise.resolve(sessions.filter((value) => !where?.assignment || (where.assignment.teacherId === assignment.teacherId && value.assignment.isActive)))),
      findFirst: vi.fn(({ where }) => Promise.resolve(sessions.find((value) => value.id === where.id && (!where.assignment || (where.assignment.teacherId === assignment.teacherId && value.assignment.isActive))) ?? null)),
    },
  }
  return { prisma, sessions }
}

async function login(app, username) {
  const response = await request(app).post('/api/v1/auth/login').send({ username, password: 'password-123' })
  return response.headers['set-cookie']
}

const sessionBody = {
  assignmentId: 60,
  sessionDate: '2026-09-17',
  startAt: '2026-09-17T08:00:00+07:00',
  endAt: '2026-09-17T09:00:00+07:00',
  timezone: 'Asia/Jakarta',
}

describe('attendance session scope', () => {
  it('rejects an assignment not owned by the authenticated teacher', async () => {
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app, 'other-teacher')
    const response = await request(app).post('/api/v1/attendance-sessions').set('Cookie', cookie).send(sessionBody)
    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('ASSIGNMENT_FORBIDDEN')
    expect(prisma.attendanceSession.create).not.toHaveBeenCalled()
  })

  it('rejects invalid time ranges before creating a session', async () => {
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app, 'teacher')
    const response = await request(app).post('/api/v1/attendance-sessions').set('Cookie', cookie).send({ ...sessionBody, endAt: sessionBody.startAt })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_TIME_RANGE')
    expect(prisma.attendanceSession.create).not.toHaveBeenCalled()
  })

  it('rejects duplicate sessions and keeps QR payload opaque', async () => {
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app, 'teacher')
    const created = await request(app).post('/api/v1/attendance-sessions').set('Cookie', cookie).send(sessionBody)
    expect(created.status).toBe(200)
    expect(created.body.data.qrPayload).toBeUndefined()
    const duplicate = await request(app).post('/api/v1/attendance-sessions').set('Cookie', cookie).send(sessionBody)
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('DUPLICATE_ATTENDANCE_SESSION')

    const list = await request(app).get('/api/v1/attendance-sessions').set('Cookie', cookie)
    expect(list.status).toBe(200)
    expect(list.body.data[0].qrPayload).toBeUndefined()
    const qr = await request(app).get('/api/v1/attendance-sessions/1/qr').set('Cookie', cookie)
    expect(qr.status).toBe(200)
    expect(isOpaqueQrPayload(qr.body.data.qrPayload)).toBe(true)
    expect(qr.body.data.qrPayload).not.toContain('Teacher')
    expect(qr.body.data.qrPayload).not.toContain('Math')
  })

  it('enforces role and teacher ownership on reads', async () => {
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const teacherCookie = await login(app, 'teacher')
    await request(app).post('/api/v1/attendance-sessions').set('Cookie', teacherCookie).send(sessionBody)
    const otherCookie = await login(app, 'other-teacher')
    expect((await request(app).get('/api/v1/attendance-sessions').set('Cookie', otherCookie)).body.data).toEqual([])
    expect((await request(app).get('/api/v1/attendance-sessions/1/qr').set('Cookie', otherCookie)).status).toBe(404)
    expect((await request(app).get('/api/v1/attendance-sessions').set('Cookie', await login(app, 'student'))).status).toBe(403)
    expect(prisma.attendanceSession.findMany).toHaveBeenCalled()
  })
})
