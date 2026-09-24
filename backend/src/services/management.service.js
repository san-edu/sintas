import { AppError } from '../middleware/errorHandler.js'
import { hashPassword } from './auth/password.js'

const publicUser = (user) => ({ id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, phone: user.phone, birthDate: user.birthDate, studentNumber: user.studentProfile?.studentNumber ?? null })

export function createManagementService({ repository }) {
  const adminOnly = (user) => { if (user.role !== 'ADMIN') throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses ke sumber daya ini.') }
  return {
    async listUsers(user, query) { adminOnly(user); const [items, total] = await repository.listUsers(query); return { items: items.map(publicUser), meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } } },
    async createUser(user, data) {
      adminOnly(user)
      if (data.role === 'STUDENT' && (!data.studentNumber || !data.educationLevelId)) throw new AppError(400, 'VALIDATION_ERROR', 'Profil siswa membutuhkan nomor siswa dan jenjang.')
      if (await repository.findUsername(data.username)) throw new AppError(409, 'DUPLICATE_USERNAME', 'Username sudah digunakan.')
      const profile = data.role === 'STUDENT' ? { type: 'STUDENT', data: { studentNumber: data.studentNumber, educationLevelId: data.educationLevelId } } : { type: data.role }
      const created = await repository.createUser({ username: data.username, passwordHash: await hashPassword(data.password), role: data.role, name: data.name, email: data.email, phone: data.phone, birthDate: data.birthDate }, profile)
      return publicUser(created)
    },
    async resetPassword(user, id, data) { adminOnly(user); const target = await repository.findUser(id); if (!target || target.role === 'ADMIN') throw new AppError(404, 'NOT_FOUND', 'Pengguna tidak ditemukan.'); await repository.updatePassword(id, await hashPassword(data.password)); return { message: 'Password berhasil direset.' } },
  }
}
