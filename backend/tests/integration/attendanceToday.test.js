import argon2 from 'argon2'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.js'

const env = {
  NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5173', JWT_SECRET: 'test-secret-that-is-long-enough-for-jwt', JWT_ISSUER: 'sintas-test', ACCESS_TOKEN_TTL: '15m', AUTH_COOKIE_NAME: 'auth_token', SCHOOL_TIMEZONE: 'Asia/Jakarta',
}
const passwordHash = await argon2.hash('password-123', { type: argon2.argon2id })
const users = [
  { id: 1, username: 'student', passwordHash, role: 'STUDENT', name: 'Student', email: 'student@test.local', studentProfile: { studentNumber: 'S-1' } },
  { id: 2, username: 'teacher', passwordHash, role: 'TEACHER', name: 'Teacher', email: 'teacher@test.local', studentProfile: null },
  { id: 3, username: 'admin', passwordHash, role: 'ADMIN', name: 'Admin', email: 'admin@test.local', studentProfile: null },
]

const baseSession = {
  id: 1,
  assignmentId: 60,
  classId: 30,
  sessionDate: new Date('2026-09-17T00:00:00.000Z'),
  createdAt: new Date('2026-09-16T02:00:00.000Z'),
  class: { name: 'XII IPA 1' },
  assignment: {
    subjectId: 40,
    subject: { name: 'Matematika' },
    teacher: { name: 'Guru Demo' },
  },
  records: [],
}

const sessions = [
  {
    ...baseSession,
    id: 10,
    startAt: new Date('2026-09-17T01:00:00.000Z'),
    endAt: new Date('2026-09-17T02:00:00.000Z'),
    records: [
      { sessionId: 10, studentId: 1, status: 'HADIR', lateMinutes: 0 },
    ],
  },
  {
    ...baseSession,
    id: 11,
    startAt: new Date('2026-09-17T02:30:00.000Z'),
    endAt: new Date('2026-09-17T03:30:00.000Z'),
  },
  {
    ...baseSession,
    id: 12,
    startAt: new Date('2026-09-17T00:00:00.000Z'),
    endAt: new Date('2026-09-17T01:00:00.000Z'),
  },
]

function createPrisma({ today = sessions } = {}) {
  const prisma = {
    user: {
      findUnique: vi.fn(({ where }) => Promise.resolve(users.find((value) => value.id === where.id || value.username === where.username) ?? null)),
    },
    attendanceSession: {
      findMany: vi.fn(() => Promise.resolve(today)),
    },
  }
  return prisma
}

function setServerTime(iso) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
}

afterEach(() => vi.useRealTimers())

async function login(app, username = 'student') {
  const response = await request(app).post('/api/v1/auth/login').send({ username, password: 'password-123' })
  return response.headers['set-cookie']
}

describe('attendance today schedule', () => {
  it('returns the student schedule for the school day with server-computed statuses', async () => {
    setServerTime('2026-09-17T01:30:00.000Z')
    const prisma = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).get('/api/v1/attendance/today').set('Cookie', cookie)

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(3)
    expect(response.body.data[0]).toEqual({
      id: 10,
      assignmentId: 60,
      classId: 30,
      className: 'XII IPA 1',
      subjectId: 40,
      subjectName: 'Matematika',
      teacherName: 'Guru Demo',
      sessionDate: '2026-09-17T00:00:00.000Z',
      startAt: '2026-09-17T01:00:00.000Z',
      endAt: '2026-09-17T02:00:00.000Z',
      createdAt: '2026-09-16T02:00:00.000Z',
      windowStatus: 'BISA_ABSEN',
      attendanceStatus: 'HADIR',
      scanned: true,
    })
    expect(response.body.data[1].windowStatus).toBe('BELUM_DIBUKA')
    expect(response.body.data[1].attendanceStatus).toBeNull()
    expect(response.body.data[1].scanned).toBe(false)
    expect(response.body.data[2].windowStatus).toBe('SELESAI')
    expect(response.body.data[2].attendanceStatus).toBe('TIDAK_HADIR')
    expect(response.body.data[2].scanned).toBe(false)

    const findMany = prisma.attendanceSession.findMany
    expect(findMany).toHaveBeenCalledTimes(1)
    const args = findMany.mock.calls[0][0]
    expect(args.where).toEqual({
      sessionDate: new Date('2026-09-17T00:00:00.000Z'),
      assignment: { isActive: true },
      class: { memberships: { some: { studentId: 1, isActive: true } } },
    })
    expect(args.orderBy).toEqual([{ startAt: 'asc' }])
  })

  it('returns an empty list for a student without active sessions', async () => {
    setServerTime('2026-09-17T01:30:00.000Z')
    const prisma = createPrisma({ today: [] })
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).get('/api/v1/attendance/today').set('Cookie', cookie)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual([])
  })

  it.each([
    ['teacher', 'teacher'],
    ['admin', 'admin'],
  ])('rejects %s from reading the student schedule', async (_label, username) => {
    const prisma = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app, username)

    const response = await request(app).get('/api/v1/attendance/today').set('Cookie', cookie)

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
    expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const prisma = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })

    const response = await request(app).get('/api/v1/attendance/today')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
    expect(prisma.attendanceSession.findMany).not.toHaveBeenCalled()
  })
})