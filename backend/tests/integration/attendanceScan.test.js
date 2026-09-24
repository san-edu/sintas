import argon2 from 'argon2'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app.js'

const env = {
  NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5173', JWT_SECRET: 'test-secret-that-is-long-enough-for-jwt', JWT_ISSUER: 'sintas-test', ACCESS_TOKEN_TTL: '15m', AUTH_COOKIE_NAME: 'auth_token', SCHOOL_TIMEZONE: 'Asia/Jakarta',
}
const passwordHash = await argon2.hash('password-123', { type: argon2.argon2id })
const qrPayload = 'a'.repeat(43)
const session = {
  id: 1,
  classId: 30,
  startAt: new Date('2026-09-17T01:00:00.000Z'),
  endAt: new Date('2026-09-17T02:00:00.000Z'),
  assignment: { id: 60, isActive: true },
}
const users = [
  { id: 1, username: 'student', passwordHash, role: 'STUDENT', name: 'Student', email: 'student@test.local', studentProfile: { studentNumber: 'S-1' } },
  { id: 2, username: 'teacher', passwordHash, role: 'TEACHER', name: 'Teacher', email: 'teacher@test.local', studentProfile: null },
]

function createPrisma({ member = true, conflict = false, assignmentActive = true } = {}) {
  const records = []
  const scanSession = { ...session, assignment: { ...session.assignment, isActive: assignmentActive } }
  const prisma = {
    user: {
      findUnique: vi.fn(({ where }) => Promise.resolve(users.find((value) => value.id === where.id || value.username === where.username) ?? null)),
      findFirst: vi.fn(({ where }) => Promise.resolve(users.find((value) => value.id === where.id && value.role === where.role) ?? null)),
    },
    attendanceSession: {
      findUnique: vi.fn(({ where }) => Promise.resolve(where.qrPayload === qrPayload ? scanSession : null)),
    },
    classStudent: {
      findFirst: vi.fn(() => Promise.resolve(member ? { id: 1, classId: session.classId, studentId: 1, isActive: true } : null)),
    },
    attendanceRecord: {
      create: vi.fn(({ data }) => {
        const existing = records.find((record) => record.sessionId === data.sessionId && record.studentId === data.studentId)
        if (existing || conflict) return Promise.reject({ code: 'P2002' })
        const record = { ...data, id: records.length + 1 }
        records.push(record)
        return Promise.resolve(record)
      }),
      findUnique: vi.fn(({ where }) => Promise.resolve(records.find((record) => record.sessionId === where.sessionId_studentId.sessionId && record.studentId === where.sessionId_studentId.studentId) ?? null)),
    },
    $transaction: vi.fn((callback) => callback({ attendanceRecord: prisma.attendanceRecord })),
  }
  return { prisma, records }
}

async function login(app) {
  const response = await request(app).post('/api/v1/auth/login').send({ username: 'student', password: 'password-123' })
  return response.headers['set-cookie']
}

function setServerTime(iso) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
}

afterEach(() => vi.useRealTimers())

describe('attendance scan', () => {
  it.each([
    ['opening boundary', '2026-09-17T00:45:00.000Z', 'HADIR', 0],
    ['start time', '2026-09-17T01:00:00.000Z', 'HADIR', 0],
    ['present boundary', '2026-09-17T01:15:00.000Z', 'HADIR', 0],
    ['late window', '2026-09-17T01:16:30.000Z', 'TERLAMBAT', 16],
    ['closing boundary', '2026-09-17T02:00:00.000Z', 'TERLAMBAT', 60],
  ])('classifies the server time at the %s', async (_name, scanAt, status, lateMinutes) => {
    setServerTime(scanAt)
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe(status)
    expect(response.body.data.lateMinutes).toBe(lateMinutes)
    expect(response.body.data.scannedAt).toBe(new Date(scanAt).toISOString())
  })

  it.each(['2026-09-17T00:44:59.999Z', '2026-09-17T02:00:00.001Z'])('rejects scans outside the window at %s', async (scanAt) => {
    setServerTime(scanAt)
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('ATTENDANCE_WINDOW_CLOSED')
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled()
  })

  it('rejects invalid QR before looking up the session', async () => {
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload: 'not-a-qr' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_QR_PAYLOAD')
    expect(prisma.attendanceSession.findUnique).not.toHaveBeenCalled()
  })

  it('rejects a student who is not an active class member', async () => {
    setServerTime('2026-09-17T01:00:00.000Z')
    const { prisma } = createPrisma({ member: false })
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('CLASS_MEMBERSHIP_REQUIRED')
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled()
  })

  it('rejects a session with an inactive assignment before membership lookup', async () => {
    setServerTime('2026-09-17T01:00:00.000Z')
    const { prisma } = createPrisma({ assignmentActive: false })
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('ATTENDANCE_SESSION_NOT_FOUND')
    expect(prisma.classStudent.findFirst).not.toHaveBeenCalled()
  })

  it('does not trust a client timestamp', async () => {
    setServerTime('2026-09-17T01:00:00.000Z')
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload, scannedAt: '2026-09-17T09:00:00.000Z' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled()
  })

  it('returns the existing record for sequential duplicate scans', async () => {
    setServerTime('2026-09-17T01:00:00.000Z')
    const { prisma } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const first = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })
    const second = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })

    expect(first.body.data.duplicate).toBe(false)
    expect(second.status).toBe(200)
    expect(second.body.data.duplicate).toBe(true)
    expect(second.body.data.id).toBe(first.body.data.id)
    expect(prisma.attendanceRecord.create).toHaveBeenCalledTimes(2)
  })

  it('returns one existing record for concurrent duplicate scans', async () => {
    setServerTime('2026-09-17T01:00:00.000Z')
    const { prisma, records } = createPrisma()
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const responses = await Promise.all([
      request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload }),
      request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload }),
    ])

    expect(responses.map((response) => response.status)).toEqual([200, 200])
    expect(responses.filter((response) => response.body.data.duplicate)).toHaveLength(1)
    expect(records).toHaveLength(1)
  })

  it('returns the existing record when the database reports a duplicate conflict', async () => {
    setServerTime('2026-09-17T01:00:00.000Z')
    const { prisma, records } = createPrisma({ conflict: true })
    records.push({ id: 9, sessionId: session.id, studentId: 1, scannedAt: new Date('2026-09-17T01:00:00.000Z'), status: 'HADIR', lateMinutes: 0 })
    const app = createApp({ prisma, env, logger: { error: vi.fn() } })
    const cookie = await login(app)

    const response = await request(app).post('/api/v1/attendance-scans').set('Cookie', cookie).send({ qrPayload })

    expect(response.status).toBe(200)
    expect(response.body.data.duplicate).toBe(true)
    expect(response.body.data.id).toBe(9)
  })
})