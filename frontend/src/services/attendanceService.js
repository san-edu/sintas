import { apiClient } from '../lib/apiClient'

export const attendanceKeys = {
  today: ['attendance', 'today'],
  historyBase: ['attendance', 'history'],
  history: (filters) => ['attendance', 'history', filters],
  scan: ['attendance', 'scan'],
  teacherSessions: ['attendance', 'sessions'],
  sessionQr: (id) => ['attendance', 'sessions', id, 'qr'],
  classAttendanceBase: ['attendance', 'classes'],
  classAttendance: (classId, filters) => ['attendance', 'classes', classId, filters],
  adminReportBase: ['reports', 'attendance'],
  adminReport: (filters) => ['reports', 'attendance', filters],
}

export async function getTodaySchedule() {
  const payload = await apiClient.get('/attendance/today')
  return payload.data
}

// Satu mutation per scan (docs/PROMPT_GUIDE.md F3): payload QR hasil decode
// dikirim apa adanya; validitas waktu/status ditentukan server. Duplicate scan
// idempotent dikembalikan 200 dengan `duplicate: true`, bukan error.
export async function scanAttendance(qrPayload) {
  const payload = await apiClient.post('/attendance-scans', { qrPayload })
  return payload.data
}

export async function getStudentHistory({
  from,
  to,
  status,
  page = 1,
  limit = 20,
}) {
  const payload = await apiClient.get('/attendance/history', {
    params: { from, to, status, page, limit },
  })
  return payload.data
}

// Sesi milik guru yang login (scope backend: assignment aktif miliknya).
export async function getTeacherSessions() {
  const payload = await apiClient.get('/attendance-sessions')
  return payload.data
}

// QR payload statis dan metadata sesi berasal dari backend; frontend tidak
// membuat atau menebak payload.
export async function getSessionQr(id) {
  const payload = await apiClient.get(`/attendance-sessions/${id}/qr`)
  return payload.data
}

export async function createAttendanceSession(data) {
  const payload = await apiClient.post('/attendance-sessions', data)
  return payload.data
}

export async function getClassAttendance(
  classId,
  { from, to, status, assignmentId, page = 1, limit = 20 } = {},
) {
  const payload = await apiClient.get(`/attendance/classes/${classId}`, {
    params: { from, to, status, assignmentId, page, limit },
  })
  return payload.data
}

// Export sebagai binary; nama file diambil dari Content-Disposition.
export function exportAttendanceReport(params) {
  return apiClient.get('/reports/attendance/export', {
    params,
    responseType: 'blob',
  })
}

// Laporan global admin; scope/filter ditentukan backend (allowlist query).
export async function getGlobalAttendanceReport({
  from,
  to,
  status,
  classId,
  page = 1,
  limit = 20,
} = {}) {
  const payload = await apiClient.get('/reports/attendance', {
    params: { from, to, status, classId, page, limit },
  })
  return payload.data
}