export function createManagementRepository(prisma) {
  return {
    listUsers({ page, limit, sort, order, role, search }) {
      const where = { ...(role ? { role } : {}), ...(search ? { OR: [{ username: { contains: search } }, { name: { contains: search } }] } : {}) }
      return Promise.all([
        prisma.user.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order }, where, select: { id: true, username: true, role: true, name: true, email: true, phone: true, birthDate: true, studentProfile: true, teacherProfile: true } }),
        prisma.user.count({ where }),
      ])
    },
    findUser(id) { return prisma.user.findUnique({ where: { id }, include: { studentProfile: true, teacherProfile: true } }) },
    findUsername(username) { return prisma.user.findUnique({ where: { username } }) },
    createUser(data, profile) {
      const nestedProfile = profile?.type === 'STUDENT' ? { studentProfile: { create: profile.data } } : profile?.type === 'TEACHER' ? { teacherProfile: { create: {} } } : {}
      return prisma.user.create({ data: { ...data, ...nestedProfile }, include: { studentProfile: true, teacherProfile: true } })
    },
    updatePassword(id, passwordHash) { return prisma.user.update({ where: { id }, data: { passwordHash } }) },
  }
}
