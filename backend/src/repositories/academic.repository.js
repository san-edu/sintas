export function createAcademicRepository(prisma) {
  const pageArgs = ({ page, limit, sort, order }) => ({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sort]: order },
  });
  return {
    listEducationLevels(query) {
      const args = pageArgs(query);
      const where = query.name ? { name: { contains: query.name } } : undefined;
      return Promise.all([
        prisma.educationLevel.findMany({ ...args, where }),
        prisma.educationLevel.count({ where }),
      ]);
    },
    createEducationLevel(data) {
      return prisma.educationLevel.create({ data });
    },
    findEducationLevel(id) {
      return prisma.educationLevel.findUnique({ where: { id } });
    },
    updateEducationLevel(id, data) {
      return prisma.educationLevel.update({ where: { id }, data });
    },
    deleteEducationLevel(id) {
      return prisma.educationLevel.delete({ where: { id } });
    },
    listClasses(query, teacherId) {
      const where = {
        ...(query.educationLevelId
          ? { educationLevelId: query.educationLevelId }
          : {}),
        ...(query.name ? { name: { contains: query.name } } : {}),
        ...(teacherId
          ? { teacherAssignments: { some: { teacherId, isActive: true } } }
          : {}),
      };
      const args = pageArgs(query);
      return Promise.all([
        prisma.class.findMany({
          ...args,
          where,
          include: { educationLevel: true },
        }),
        prisma.class.count({ where }),
      ]);
    },
    createClass(data) {
      return prisma.class.create({ data, include: { educationLevel: true } });
    },
    updateClass(id, data) {
      return prisma.class.update({
        where: { id },
        data,
        include: { educationLevel: true },
      });
    },
    deleteClass(id) {
      return prisma.class.delete({ where: { id } });
    },
    listSubjects(query, teacherId) {
      const where = {
        ...(query.name ? { name: { contains: query.name } } : {}),
        ...(teacherId
          ? { teacherAssignments: { some: { teacherId, isActive: true } } }
          : {}),
      };
      const args = pageArgs(query);
      return Promise.all([
        prisma.subject.findMany({ ...args, where }),
        prisma.subject.count({ where }),
      ]);
    },
    createSubject(data) {
      return prisma.subject.create({ data });
    },
    updateSubject(id, data) {
      return prisma.subject.update({ where: { id }, data });
    },
    deleteSubject(id) {
      return prisma.subject.delete({ where: { id } });
    },
    findStudent(id) {
      return prisma.user.findFirst({ where: { id, role: "STUDENT" } });
    },
    findTeacher(id) {
      return prisma.user.findFirst({ where: { id, role: "TEACHER" } });
    },
    findClass(id) {
      return prisma.class.findUnique({ where: { id } });
    },
    findSubject(id) {
      return prisma.subject.findUnique({ where: { id } });
    },
    findActiveMembership(classId, studentId) {
      return prisma.classStudent.findUnique({
        where: {
          classId_studentId_isActive: { classId, studentId, isActive: true },
        },
      });
    },
    findActiveMembershipForStudent(studentId) {
      return prisma.classStudent.findFirst({
        where: { studentId, isActive: true },
      });
    },
    findActiveAssignment(teacherId, classId, subjectId) {
      return prisma.teacherAssignment.findUnique({
        where: {
          teacherId_classId_subjectId_isActive: {
            teacherId,
            classId,
            subjectId,
            isActive: true,
          },
        },
      });
    },
    createMembership(data) {
      return prisma.classStudent.create({
        data,
        include: { class: true, student: true },
      });
    },
    updateMembership(id, data) {
      return prisma.classStudent.update({ where: { id }, data });
    },
    findMembership(id) {
      return prisma.classStudent.findUnique({ where: { id } });
    },
    createAssignment(data) {
      return prisma.teacherAssignment.create({
        data,
        include: { class: true, subject: true, teacher: true },
      });
    },
    updateAssignment(id, data) {
      return prisma.teacherAssignment.update({ where: { id }, data });
    },
    findAssignment(id) {
      return prisma.teacherAssignment.findUnique({ where: { id } });
    },
    listAssignmentsForTeacher(teacherId) {
      return prisma.teacherAssignment.findMany({
        where: { teacherId, isActive: true },
        include: {
          class: { include: { educationLevel: true } },
          subject: true,
        },
      });
    },
    listMembershipsForStudent(studentId) {
      return prisma.classStudent.findMany({
        where: { studentId, isActive: true },
        include: { class: { include: { educationLevel: true } } },
      });
    },
    listMemberships(query) {
      const where = query.classId ? { classId: query.classId } : undefined;
      const args = pageArgs(query);
      return Promise.all([
        prisma.classStudent.findMany({
          ...args,
          where,
          include: { class: true, student: true },
        }),
        prisma.classStudent.count({ where }),
      ]);
    },
    listAssignmentsForAdmin(query) {
      const where = query.teacherId ? { teacherId: query.teacherId } : undefined;
      const args = pageArgs(query);
      return Promise.all([
        prisma.teacherAssignment.findMany({
          ...args,
          where,
          include: { class: true, subject: true, teacher: true },
        }),
        prisma.teacherAssignment.count({ where }),
      ]);
    },
  };
}
