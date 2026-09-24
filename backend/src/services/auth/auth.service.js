import { AppError } from '../../middleware/errorHandler.js'
import { hashPassword, verifyPassword } from './password.js'

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  name: user.name,
  email: user.email,
  phone: user.phone,
  birthDate: user.birthDate,
  studentNumber: user.studentProfile?.studentNumber ?? null,
})

export function createAuthService({ userRepository }) {
  return {
    async login({ username, password }) {
      const user = await userRepository.findByUsername(username)
      const valid = user ? await verifyPassword(user.passwordHash, password).catch(() => false) : false
      if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Username atau password tidak sesuai.')
      return publicUser(user)
    },
    async forgotPassword({ email, birthDate, password }) {
      const user = await userRepository.findByEmailAndBirthDate(email, birthDate)
      if (!user) throw new AppError(400, 'RESET_DATA_INVALID', 'Data pemulihan password tidak sesuai.')
      await userRepository.updatePassword(user.id, await hashPassword(password))
      return { message: 'Password berhasil diubah.' }
    },
    async getProfile(id) {
      const user = await userRepository.findById(id)
      if (!user) throw new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak valid atau sudah berakhir.')
      return publicUser(user)
    },
    async updateProfile(id, data) {
      const user = await userRepository.updateProfile(id, data)
      return publicUser(user)
    },
  }
}
