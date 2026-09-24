import { AppError } from '../middleware/errorHandler.js'

export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN']

export function canAccessRole(role, allowedRoles) {
  return allowedRoles.includes(role)
}

export function assertRole(role, allowedRoles) {
  if (!canAccessRole(role, allowedRoles)) {
    throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses ke sumber daya ini.')
  }
}
