import { AppError } from "../middleware/errorHandler.js";

const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  role: user.role,
  name: user.name,
  email: user.email,
  phone: user.phone,
  birthDate: user.birthDate,
  studentNumber: user.studentProfile?.studentNumber ?? null,
});
const pageResult = ([items, total], query) => ({
  items,
  meta: {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  },
});
const requireAdmin = (user) => {
  if (user.role !== "ADMIN")
    throw new AppError(
      403,
      "FORBIDDEN",
      "Anda tidak memiliki akses ke sumber daya ini.",
    );
};

export function createAcademicService({ repository }) {
  const requireEntity = async (entity, id, finder) => {
    const value = await finder(id);
    if (!value)
      throw new AppError(404, "NOT_FOUND", `${entity} tidak ditemukan.`);
    return value;
  };
  return {
    async listEducationLevels(user, query) {
      requireAdmin(user);
      return pageResult(await repository.listEducationLevels(query), query);
    },
    async createEducationLevel(user, data) {
      requireAdmin(user);
      return repository.createEducationLevel(data);
    },
    async updateEducationLevel(user, id, data) {
      requireAdmin(user);
      await requireEntity(
        "Jenjang",
        id,
        repository.findEducationLevel ?? (() => null),
      );
      return repository.updateEducationLevel(id, data);
    },
    async deleteEducationLevel(user, id) {
      requireAdmin(user);
      await requireEntity(
        "Jenjang",
        id,
        repository.findEducationLevel ?? (() => null),
      );
      return repository.deleteEducationLevel(id);
    },
    async listClasses(user, query) {
      if (!["ADMIN", "TEACHER"].includes(user.role))
        throw new AppError(
          403,
          "FORBIDDEN",
          "Anda tidak memiliki akses ke sumber daya ini.",
        );
      return pageResult(
        await repository.listClasses(
          query,
          user.role === "TEACHER" ? user.id : undefined,
        ),
        query,
      );
    },
    async createClass(user, data) {
      requireAdmin(user);
      await requireEntity(
        "Jenjang",
        data.educationLevelId,
        repository.findEducationLevel,
      );
      return repository.createClass(data);
    },
    async updateClass(user, id, data) {
      requireAdmin(user);
      await requireEntity("Kelas", id, repository.findClass);
      return repository.updateClass(id, data);
    },
    async deleteClass(user, id) {
      requireAdmin(user);
      await requireEntity("Kelas", id, repository.findClass);
      return repository.deleteClass(id);
    },
    async listSubjects(user, query) {
      if (!["ADMIN", "TEACHER"].includes(user.role))
        throw new AppError(
          403,
          "FORBIDDEN",
          "Anda tidak memiliki akses ke sumber daya ini.",
        );
      return pageResult(
        await repository.listSubjects(
          query,
          user.role === "TEACHER" ? user.id : undefined,
        ),
        query,
      );
    },
    async createSubject(user, data) {
      requireAdmin(user);
      return repository.createSubject(data);
    },
    async updateSubject(user, id, data) {
      requireAdmin(user);
      await requireEntity("Mata pelajaran", id, repository.findSubject);
      return repository.updateSubject(id, data);
    },
    async deleteSubject(user, id) {
      requireAdmin(user);
      await requireEntity("Mata pelajaran", id, repository.findSubject);
      return repository.deleteSubject(id);
    },
    async createMembership(user, data) {
      requireAdmin(user);
      await requireEntity("Siswa", data.studentId, repository.findStudent);
      await requireEntity("Kelas", data.classId, repository.findClass);
      if (await repository.findActiveMembershipForStudent(data.studentId))
        throw new AppError(
          409,
          "ACTIVE_CLASS_MEMBERSHIP_EXISTS",
          "Siswa sudah memiliki kelas aktif.",
        );
      return repository.createMembership({ ...data, isActive: true });
    },
    async updateMembership(user, id, data) {
      requireAdmin(user);
      const membership = await requireEntity(
        "Penempatan siswa",
        id,
        repository.findMembership,
      );
      return repository.updateMembership(membership.id, data);
    },
    async createAssignment(user, data) {
      requireAdmin(user);
      await requireEntity("Guru", data.teacherId, repository.findTeacher);
      await requireEntity("Kelas", data.classId, repository.findClass);
      await requireEntity(
        "Mata pelajaran",
        data.subjectId,
        repository.findSubject,
      );
      if (
        await repository.findActiveAssignment(
          data.teacherId,
          data.classId,
          data.subjectId,
        )
      )
        throw new AppError(
          409,
          "DUPLICATE_ASSIGNMENT",
          "Penugasan aktif sudah ada.",
        );
      return repository.createAssignment({ ...data, isActive: true });
    },
    async updateAssignment(user, id, data) {
      requireAdmin(user);
      const assignment = await requireEntity(
        "Penugasan",
        id,
        repository.findAssignment,
      );
      return repository.updateAssignment(assignment.id, data);
    },
    async listAssignments(user) {
      if (user.role !== "TEACHER")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya guru yang dapat melihat penugasan miliknya.",
        );
      return repository.listAssignmentsForTeacher(user.id);
    },
    async listMemberships(user, query) {
      requireAdmin(user);
      return pageResult(await repository.listMemberships(query), query);
    },
    async listAssignmentsManage(user, query) {
      requireAdmin(user);
      return pageResult(await repository.listAssignmentsForAdmin(query), query);
    },
    async listMyClasses(user) {
      if (user.role !== "STUDENT")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya siswa yang dapat melihat kelas aktifnya.",
        );
      return repository.listMembershipsForStudent(user.id);
    },
    publicUser,
  };
}
