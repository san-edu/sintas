import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../app/router'
import { SessionProvider } from '../app/session/SessionProvider'
import { queryClient } from '../lib/queryClient'

export const studentUser = {
  id: 1,
  username: 'student.demo',
  role: 'STUDENT',
  name: 'Siswa Demo',
  email: 'student.demo@school.test',
  phone: null,
  birthDate: null,
  studentNumber: 'S-0001',
}

export const teacherUser = {
  id: 2,
  username: 'teacher.demo',
  role: 'TEACHER',
  name: 'Guru Demo',
  email: 'teacher.demo@school.test',
  phone: null,
  birthDate: null,
}

export const adminUser = {
  id: 3,
  username: 'admin.demo',
  role: 'ADMIN',
  name: 'Admin Demo',
  email: 'admin.demo@school.test',
  phone: null,
  birthDate: null,
}

export function renderApp(initialEntries) {
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <AppRoutes />
        </MemoryRouter>
      </SessionProvider>
    </QueryClientProvider>,
  )
}

export const activeBanner = {
  id: 1,
  title: 'Ujian Tengah Semester',
  imageUrl: null,
  content: 'Gelombang 1 dimulai Senin.',
  isActive: true,
  displayStartAt: null,
  displayEndAt: null,
  createdById: 3,
  createdAt: '2026-09-10T02:00:00.000Z',
  updatedAt: '2026-09-10T02:00:00.000Z',
}

export function scheduleItem(overrides) {
  return {
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
    windowStatus: 'BELUM_DIBUKA',
    attendanceStatus: null,
    scanned: false,
    ...overrides,
  }
}

export function reportItem(overrides) {
  return {
    id: 100,
    sessionId: 10,
    studentId: 1,
    studentName: 'Siswa Demo',
    studentNumber: 'S-0001',
    sessionDate: '2026-09-16T00:00:00.000Z',
    classId: 30,
    className: 'XII IPA 1',
    subjectId: 40,
    subjectName: 'Matematika',
    startAt: '2026-09-16T01:00:00.000Z',
    endAt: '2026-09-16T02:00:00.000Z',
    scannedAt: '2026-09-16T01:16:30.000Z',
    status: 'TERLAMBAT',
    lateMinutes: 16,
    ...overrides,
  }
}

export function assignmentItem(overrides) {
  return {
    id: 60,
    teacherId: 2,
    classId: 30,
    subjectId: 40,
    isActive: true,
    createdAt: '2026-09-01T02:00:00.000Z',
    updatedAt: '2026-09-01T02:00:00.000Z',
    class: {
      id: 30,
      name: 'XII IPA 1',
      educationLevelId: 3,
      createdAt: '2026-09-01T02:00:00.000Z',
      updatedAt: '2026-09-01T02:00:00.000Z',
      educationLevel: {
        id: 3,
        name: 'SMA',
        createdAt: '2026-09-01T02:00:00.000Z',
        updatedAt: '2026-09-01T02:00:00.000Z',
      },
    },
    subject: {
      id: 40,
      name: 'Matematika',
      createdAt: '2026-09-01T02:00:00.000Z',
      updatedAt: '2026-09-01T02:00:00.000Z',
    },
    ...overrides,
  }
}

export function sessionItem(overrides) {
  return {
    id: 10,
    assignmentId: 60,
    classId: 30,
    className: 'XII IPA 1',
    subjectId: 40,
    subjectName: 'Matematika',
    sessionDate: '2026-09-17T00:00:00.000Z',
    startAt: '2026-09-17T01:00:00.000Z',
    endAt: '2026-09-17T02:00:00.000Z',
    createdAt: '2026-09-16T02:00:00.000Z',
    ...overrides,
  }
}

export function sessionQrItem(overrides) {
  return {
    ...sessionItem(),
    qrPayload: 'S-'.padEnd(43, 'x'),
    ...overrides,
  }
}