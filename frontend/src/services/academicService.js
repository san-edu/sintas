import { apiClient } from '../lib/apiClient'

export const academicKeys = {
  assignments: ['academic', 'assignments'],
  educationLevels: (filters = {}) => (Object.keys(filters).length ? ['academic', 'education-levels', filters] : ['academic', 'education-levels']),
  classes: (filters = {}) => (Object.keys(filters).length ? ['academic', 'classes', filters] : ['academic', 'classes']),
  subjects: (filters = {}) => (Object.keys(filters).length ? ['academic', 'subjects', filters] : ['academic', 'subjects']),
  memberships: (filters = {}) => (Object.keys(filters).length ? ['academic', 'memberships', filters] : ['academic', 'memberships']),
  assignmentsManage: (filters = {}) => (Object.keys(filters).length ? ['academic', 'assignments', 'manage', filters] : ['academic', 'assignments', 'manage']),
}

// Hanya mengembalikan assignment aktif milik guru yang login; scope ditentukan
// backend, bukan oleh parameter frontend (frontend/GUIDE.md section 5).
export async function getTeacherAssignments() {
  const payload = await apiClient.get('/academic/assignments')
  return payload.data
}

export async function getEducationLevels({ page = 1, limit = 100 } = {}) {
  const payload = await apiClient.get('/academic/education-levels', {
    params: { page, limit },
  })
  return payload.data
}

export async function createEducationLevel(data) {
  const payload = await apiClient.post('/academic/education-levels', data)
  return payload.data
}

export async function updateEducationLevel(id, data) {
  const payload = await apiClient.patch(`/academic/education-levels/${id}`, data)
  return payload.data
}

export async function deleteEducationLevel(id) {
  const payload = await apiClient.delete(`/academic/education-levels/${id}`)
  return payload.data
}

export async function getClasses({ page = 1, limit = 20, educationLevelId, name } = {}) {
  const payload = await apiClient.get('/academic/classes', {
    params: { page, limit, educationLevelId, name },
  })
  return payload.data
}

export async function createClass(data) {
  const payload = await apiClient.post('/academic/classes', data)
  return payload.data
}

export async function updateClass(id, data) {
  const payload = await apiClient.patch(`/academic/classes/${id}`, data)
  return payload.data
}

export async function deleteClass(id) {
  const payload = await apiClient.delete(`/academic/classes/${id}`)
  return payload.data
}

export async function getSubjects({ page = 1, limit = 20, name } = {}) {
  const payload = await apiClient.get('/academic/subjects', {
    params: { page, limit, name },
  })
  return payload.data
}

export async function createSubject(data) {
  const payload = await apiClient.post('/academic/subjects', data)
  return payload.data
}

export async function updateSubject(id, data) {
  const payload = await apiClient.patch(`/academic/subjects/${id}`, data)
  return payload.data
}

export async function deleteSubject(id) {
  const payload = await apiClient.delete(`/academic/subjects/${id}`)
  return payload.data
}

export async function getMemberships({ page = 1, limit = 20, classId } = {}) {
  const payload = await apiClient.get('/academic/memberships', {
    params: { page, limit, classId },
  })
  return payload.data
}

export async function getAssignmentsManage({ page = 1, limit = 20, teacherId } = {}) {
  const payload = await apiClient.get('/academic/assignments/manage', {
    params: { page, limit, teacherId },
  })
  return payload.data
}