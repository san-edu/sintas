import { Router } from 'express'
import { createHealthRouter } from './health.routes.js'
import { createAuthRouter } from './auth.routes.js'
import { createAcademicRouter } from './academic.routes.js'
import { createUserRouter } from './user.routes.js'
import { createBannerRouter } from './banner.routes.js'
import { createAttendanceHistoryRouter, createAttendanceReportRouter, createAttendanceRouter, createAttendanceScanRouter } from './attendance.routes.js'

export function createRoutes({ prisma, env }) {
  const router = Router()
  const health = createHealthRouter({ prisma })
  const auth = createAuthRouter({ prisma, env })
  const academic = createAcademicRouter({ prisma, env })
  const users = createUserRouter({ prisma, env })
  const banners = createBannerRouter({ prisma, env })
  const attendance = createAttendanceRouter({ prisma, env })
  const attendanceScans = createAttendanceScanRouter({ prisma, env })
  const attendanceHistory = createAttendanceHistoryRouter({ prisma, env })
  const attendanceReports = createAttendanceReportRouter({ prisma, env })

  router.get('/health/live', health.live)
  router.get('/health/ready', health.ready)
  router.use('/api/v1/auth', auth)
  router.get('/api/v1/me', auth.me)
  router.patch('/api/v1/me', auth.updateMe)
  router.use('/api/v1/academic', academic)
  router.use('/api/v1/users', users)
  router.use('/api/v1/banners', banners)
  router.use('/api/v1/attendance-sessions', attendance)
  router.use('/api/v1/attendance-scans', attendanceScans)
  router.use('/api/v1/attendance', attendanceHistory)
  router.use('/api/v1/reports', attendanceReports)

  return router
}