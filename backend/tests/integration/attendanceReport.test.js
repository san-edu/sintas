import argon2 from "argon2";
import ExcelJS from "exceljs";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";

const env = {
  NODE_ENV: "test",
  CORS_ORIGIN: "http://localhost:5173",
  JWT_SECRET: "test-secret-that-is-long-enough-for-jwt",
  JWT_ISSUER: "sintas-test",
  ACCESS_TOKEN_TTL: "15m",
  AUTH_COOKIE_NAME: "auth_token",
  SCHOOL_TIMEZONE: "Asia/Jakarta",
};
const passwordHash = await argon2.hash("password-123", {
  type: argon2.argon2id,
});
const users = [
  {
    id: 1,
    username: "admin",
    passwordHash,
    role: "ADMIN",
    name: "Admin",
    email: "admin@test.local",
    studentProfile: null,
  },
  {
    id: 2,
    username: "teacher",
    passwordHash,
    role: "TEACHER",
    name: "Teacher",
    email: "teacher@test.local",
    studentProfile: null,
  },
  {
    id: 3,
    username: "student",
    passwordHash,
    role: "STUDENT",
    name: "Student",
    email: "student@test.local",
    studentProfile: { studentNumber: "S-1" },
  },
  {
    id: 4,
    username: "other-student",
    passwordHash,
    role: "STUDENT",
    name: "Other Student",
    email: "other-student@test.local",
    studentProfile: { studentNumber: "S-2" },
  },
  {
    id: 5,
    username: "other-teacher",
    passwordHash,
    role: "TEACHER",
    name: "Other Teacher",
    email: "other-teacher@test.local",
    studentProfile: null,
  },
];

const students = [
  { id: 3, name: "Student", studentProfile: { studentNumber: "S-1" } },
  { id: 4, name: "Other Student", studentProfile: { studentNumber: "S-2" } },
];
const sessions = [
  {
    id: 10,
    assignmentId: 60,
    classId: 30,
    sessionDate: new Date("2026-09-16T00:00:00.000Z"),
    startAt: new Date("2026-09-16T01:00:00.000Z"),
    endAt: new Date("2026-09-16T02:00:00.000Z"),
    assignment: {
      subjectId: 40,
      subject: { id: 40, name: "Math" },
      teacherId: 2,
      isActive: true,
    },
    class: {
      id: 30,
      name: "X IPA 1",
      memberships: students.map((student) => ({
        studentId: student.id,
        isActive: true,
        student,
      })),
    },
    records: [
      {
        id: 100,
        sessionId: 10,
        studentId: 3,
        scannedAt: new Date("2026-09-16T01:05:00.000Z"),
        status: "HADIR",
        lateMinutes: 0,
        student: students[0],
      },
    ],
  },
  {
    id: 11,
    assignmentId: 61,
    classId: 31,
    sessionDate: new Date("2026-09-16T00:00:00.000Z"),
    startAt: new Date("2026-09-16T03:00:00.000Z"),
    endAt: new Date("2026-09-16T04:00:00.000Z"),
    assignment: {
      subjectId: 41,
      subject: { id: 41, name: "Science" },
      teacherId: 5,
      isActive: true,
    },
    class: {
      id: 31,
      name: "X IPA 2",
      memberships: [{ studentId: 4, isActive: true, student: students[1] }],
    },
    records: [
      {
        id: 101,
        sessionId: 11,
        studentId: 4,
        scannedAt: new Date("2026-09-16T03:05:00.000Z"),
        status: "HADIR",
        lateMinutes: 0,
        student: students[1],
      },
    ],
  },
];

function createPrisma() {
  const prisma = {
    user: {
      findUnique: vi.fn(({ where }) =>
        Promise.resolve(
          users.find(
            (value) =>
              value.id === where.id || value.username === where.username,
          ) ?? null,
        ),
      ),
      findFirst: vi.fn(({ where }) =>
        Promise.resolve(
          users.find(
            (value) => value.id === where.id && value.role === where.role,
          ) ?? null,
        ),
      ),
    },
    attendanceSession: {
      findMany: vi.fn(({ where }) =>
        Promise.resolve(
          sessions.filter((session) => {
            if (
              where.sessionDate?.gte &&
              session.sessionDate < where.sessionDate.gte
            )
              return false;
            if (
              where.sessionDate?.lte &&
              session.sessionDate > where.sessionDate.lte
            )
              return false;
            if (where.classId && session.classId !== where.classId)
              return false;
            if (
              where.assignmentId &&
              session.assignmentId !== where.assignmentId
            )
              return false;
            if (
              where.assignment?.teacherId &&
              session.assignment.teacherId !== where.assignment.teacherId
            )
              return false;
            if (
              where.class?.memberships?.some?.studentId &&
              !session.class.memberships.some(
                ({ studentId }) =>
                  studentId === where.class.memberships.some.studentId,
              )
            )
              return false;
            return true;
          }),
        ),
      ),
      count: vi.fn(({ where }) =>
        Promise.resolve(
          sessions.filter((session) => {
            if (
              where.sessionDate?.gte &&
              session.sessionDate < where.sessionDate.gte
            )
              return false;
            if (
              where.sessionDate?.lte &&
              session.sessionDate > where.sessionDate.lte
            )
              return false;
            if (where.classId && session.classId !== where.classId)
              return false;
            if (
              where.assignment?.teacherId &&
              session.assignment.teacherId !== where.assignment.teacherId
            )
              return false;
            return true;
          }).length,
        ),
      ),
    },
  };
  return prisma;
}

async function login(app, username) {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({ username, password: "password-123" });
  return response.headers["set-cookie"];
}

function binaryParser(response, callback) {
  const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk));
  response.on("end", () => callback(null, Buffer.concat(chunks)));
}

describe("attendance history and reports", () => {
  it("returns only the authenticated student history and computes one absence", async () => {
    const prisma = createPrisma();
    const app = createApp({ prisma, env, logger: { error: vi.fn() } });
    const response = await request(app)
      .get("/api/v1/attendance/history?from=2026-09-16&to=2026-09-16")
      .set("Cookie", await login(app, "other-student"));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items.map(({ status }) => status)).toEqual([
      "TIDAK_HADIR",
      "HADIR",
    ]);
    expect(
      response.body.data.items.every(({ studentId }) => studentId === 4),
    ).toBe(true);
    expect(response.body.data.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
    });
  });

  it("does not allow a student to expand scope or see another class", async () => {
    const prisma = createPrisma();
    const app = createApp({ prisma, env, logger: { error: vi.fn() } });
    const cookie = await login(app, "student");
    const response = await request(app)
      .get("/api/v1/attendance/history?studentId=4")
      .set("Cookie", cookie);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("scopes teacher detail to owned assignments and rejects other roles", async () => {
    const prisma = createPrisma();
    const app = createApp({ prisma, env, logger: { error: vi.fn() } });
    const teacherResponse = await request(app)
      .get("/api/v1/attendance/classes/30")
      .set("Cookie", await login(app, "teacher"));
    const otherTeacherResponse = await request(app)
      .get("/api/v1/attendance/classes/30")
      .set("Cookie", await login(app, "other-teacher"));
    const studentResponse = await request(app)
      .get("/api/v1/attendance/classes/30")
      .set("Cookie", await login(app, "student"));

    expect(teacherResponse.body.data.items).toHaveLength(2);
    expect(otherTeacherResponse.body.data.items).toEqual([]);
    expect(studentResponse.status).toBe(403);
  });

  it("allows admin global report and returns a clear empty result", async () => {
    const prisma = createPrisma();
    const app = createApp({ prisma, env, logger: { error: vi.fn() } });
    const cookie = await login(app, "admin");
    const response = await request(app)
      .get("/api/v1/reports/attendance?status=TERLAMBAT")
      .set("Cookie", cookie);
    const empty = await request(app)
      .get("/api/v1/reports/attendance?from=2027-01-01&to=2027-01-02")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual([]);
    expect(empty.body.data).toMatchObject({
      items: [],
      meta: { total: 0, totalPages: 0 },
    });
  });

  it("exports a readable workbook with the report columns for an admin", async () => {
    const app = createApp({
      prisma: createPrisma(),
      env,
      logger: { error: vi.fn() },
    });
    const response = await request(app)
      .get("/api/v1/reports/attendance/export?from=2026-09-16&to=2026-09-16")
      .buffer(true)
      .parse(binaryParser)
      .set("Cookie", await login(app, "admin"));

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers["content-disposition"]).toContain(
      "laporan-kehadiran-20260916-20260916.xlsx",
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.body);
    const worksheet = workbook.getWorksheet("Kehadiran");
    expect(worksheet.getRow(1).values.slice(1)).toEqual([
      "Tanggal sesi",
      "Kelas",
      "Mata pelajaran",
      "Nama siswa",
      "NIM",
      "Status",
      "Menit terlambat",
      "Waktu scan",
    ]);
    expect(worksheet.getRow(2).values.slice(1)).toContain("HADIR");
  });

  it("scopes teacher export and rejects other roles", async () => {
    const app = createApp({
      prisma: createPrisma(),
      env,
      logger: { error: vi.fn() },
    });
    const teacher = await request(app)
      .get("/api/v1/reports/attendance/export")
      .buffer(true)
      .parse(binaryParser)
      .set("Cookie", await login(app, "teacher"));
    const otherTeacher = await request(app)
      .get("/api/v1/reports/attendance/export")
      .buffer(true)
      .parse(binaryParser)
      .set("Cookie", await login(app, "other-teacher"));
    const student = await request(app)
      .get("/api/v1/reports/attendance/export")
      .set("Cookie", await login(app, "student"));

    expect(teacher.status).toBe(200);
    expect(otherTeacher.status).toBe(200);
    const teacherWorkbook = new ExcelJS.Workbook();
    const otherTeacherWorkbook = new ExcelJS.Workbook();
    await teacherWorkbook.xlsx.load(teacher.body);
    await otherTeacherWorkbook.xlsx.load(otherTeacher.body);
    expect(
      teacherWorkbook.getWorksheet("Kehadiran").getRow(2).values,
    ).toContain("X IPA 1");
    expect(
      otherTeacherWorkbook.getWorksheet("Kehadiran").getRow(2).values,
    ).toContain("X IPA 2");
    expect(student.status).toBe(403);
  });

  it("returns a consistent error when an export has no rows", async () => {
    const app = createApp({
      prisma: createPrisma(),
      env,
      logger: { error: vi.fn() },
    });
    const response = await request(app)
      .get("/api/v1/reports/attendance/export?from=2027-01-01&to=2027-01-02")
      .set("Cookie", await login(app, "admin"));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NO_DATA_TO_EXPORT",
        message: "Tidak ada data untuk diekspor.",
      },
    });
  });
});
