import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedPassword = process.env.SEED_PASSWORD ?? "Sintas-Dev-Only-ChangeMe";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed cannot run in production.");
  }

  const passwordHash = await argon2.hash(seedPassword, {
    type: argon2.argon2id,
  });

  const educationLevel = await prisma.educationLevel.upsert({
    where: { name: "SMA" },
    update: {},
    create: { name: "SMA" },
  });
  const student = await prisma.user.upsert({
    where: { username: "student.demo" },
    update: {
      passwordHash,
      role: "STUDENT",
      name: "Siswa Demo",
      email: "student.demo@example.test",
    },
    create: {
      username: "student.demo",
      passwordHash,
      role: "STUDENT",
      name: "Siswa Demo",
      email: "student.demo@example.test",
    },
  });
  const teacher = await prisma.user.upsert({
    where: { username: "teacher.demo" },
    update: {
      passwordHash,
      role: "TEACHER",
      name: "Guru Demo",
      email: "teacher.demo@example.test",
    },
    create: {
      username: "teacher.demo",
      passwordHash,
      role: "TEACHER",
      name: "Guru Demo",
      email: "teacher.demo@example.test",
    },
  });
  const admin = await prisma.user.upsert({
    where: { username: "admin.demo" },
    update: {
      passwordHash,
      role: "ADMIN",
      name: "Admin Demo",
      email: "admin.demo@example.test",
    },
    create: {
      username: "admin.demo",
      passwordHash,
      role: "ADMIN",
      name: "Admin Demo",
      email: "admin.demo@example.test",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: { studentNumber: "S-0001", educationLevelId: educationLevel.id },
    create: {
      userId: student.id,
      studentNumber: "S-0001",
      educationLevelId: educationLevel.id,
    },
  });
  await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: { userId: teacher.id },
  });

  const classRecord = await prisma.class.upsert({
    where: {
      educationLevelId_name: {
        educationLevelId: educationLevel.id,
        name: "XII IPA 1",
      },
    },
    update: {},
    create: { name: "XII IPA 1", educationLevelId: educationLevel.id },
  });
  const subject = await prisma.subject.upsert({
    where: { name: "Matematika" },
    update: {},
    create: { name: "Matematika" },
  });
  await prisma.classStudent.upsert({
    where: {
      classId_studentId_isActive: {
        classId: classRecord.id,
        studentId: student.id,
        isActive: true,
      },
    },
    update: {},
    create: { classId: classRecord.id, studentId: student.id, isActive: true },
  });
  const assignment = await prisma.teacherAssignment.upsert({
    where: {
      teacherId_classId_subjectId_isActive: {
        teacherId: teacher.id,
        classId: classRecord.id,
        subjectId: subject.id,
        isActive: true,
      },
    },
    update: {},
    create: {
      teacherId: teacher.id,
      classId: classRecord.id,
      subjectId: subject.id,
      isActive: true,
    },
  });

  await prisma.attendanceSession.upsert({
    where: { qrPayload: "dev-session-matematika-20260917" },
    update: {},
    create: {
      assignmentId: assignment.id,
      classId: classRecord.id,
      sessionDate: new Date("2026-09-17T00:00:00.000Z"),
      startAt: new Date("2026-09-17T00:00:00.000Z"),
      endAt: new Date("2026-09-17T01:00:00.000Z"),
      qrPayload: "dev-session-matematika-20260917",
      createdById: teacher.id,
    },
  });
  await prisma.banner.upsert({
    where: { id: 1 },
    update: {
      title: "Selamat datang",
      content: "Banner development",
      isActive: true,
      createdById: admin.id,
    },
    create: {
      id: 1,
      title: "Selamat datang",
      content: "Banner development",
      isActive: true,
      createdById: admin.id,
    },
  });

  console.info("Development seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
