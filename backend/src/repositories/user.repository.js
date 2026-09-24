export function createUserRepository(prisma) {
  return {
    findByUsername(username) {
      return prisma.user.findUnique({ where: { username }, include: { studentProfile: true } })
    },
    findByEmailAndBirthDate(email, birthDate) {
      return prisma.user.findFirst({ where: { email, birthDate }, include: { studentProfile: true } })
    },
    findById(id) {
      return prisma.user.findUnique({ where: { id }, include: { studentProfile: true } })
    },
    updateProfile(id, data) {
      return prisma.user.update({ where: { id }, data, include: { studentProfile: true } })
    },
    updatePassword(id, passwordHash) {
      return prisma.user.update({ where: { id }, data: { passwordHash } })
    },
  }
}
