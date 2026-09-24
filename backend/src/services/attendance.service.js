import { createQrPayload } from "../domain/attendanceQr.js";
import { normalizeSessionTimes, localDate } from "../domain/attendanceSession.js";
import {
  classifyAttendanceScan,
  classifyScheduleItem,
} from "../domain/attendanceStatus.js";
import { isOpaqueQrPayload } from "../domain/attendanceQr.js";
import { AppError } from "../middleware/errorHandler.js";
import ExcelJS from "exceljs";

const sessionMetadata = (session) => ({
  id: session.id,
  assignmentId: session.assignmentId,
  classId: session.classId,
  className: session.class?.name ?? session.assignment?.class?.name,
  subjectId: session.assignment?.subjectId,
  subjectName: session.assignment?.subject?.name,
  sessionDate: session.sessionDate,
  startAt: session.startAt,
  endAt: session.endAt,
  createdAt: session.createdAt,
});

function requireReader(user) {
  if (!["ADMIN", "TEACHER"].includes(user.role))
    throw new AppError(
      403,
      "FORBIDDEN",
      "Anda tidak memiliki akses ke sesi absensi.",
    );
}

const scanMetadata = (record, duplicate = false) => ({
  id: record.id,
  sessionId: record.sessionId,
  scannedAt: record.scannedAt,
  status: record.status,
  lateMinutes: record.lateMinutes ?? 0,
  duplicate,
});

const scheduleItem = (session, schedule) => ({
  id: session.id,
  assignmentId: session.assignmentId,
  classId: session.classId,
  className: session.class?.name,
  subjectId: session.assignment?.subjectId,
  subjectName: session.assignment?.subject?.name,
  teacherName: session.assignment?.teacher?.name ?? null,
  sessionDate: session.sessionDate,
  startAt: session.startAt,
  endAt: session.endAt,
  createdAt: session.createdAt,
  windowStatus: schedule.windowStatus,
  attendanceStatus: schedule.attendanceStatus,
  scanned: schedule.scanned,
});

const reportMetadata = ({ session, student, record, status }) => ({
  id: record?.id ?? `computed-${session.id}-${student.id}`,
  sessionId: session.id,
  studentId: student.id,
  studentName: student.name,
  studentNumber: student.studentProfile?.studentNumber ?? null,
  sessionDate: session.sessionDate,
  classId: session.classId,
  className: session.class?.name,
  subjectId: session.assignment?.subjectId,
  subjectName: session.assignment?.subject?.name,
  startAt: session.startAt,
  endAt: session.endAt,
  scannedAt: record?.scannedAt ?? null,
  status,
  lateMinutes: record?.lateMinutes ?? 0,
});

const pageResult = (items, query, total) => ({
  items,
  meta: {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  },
});
const exportHeaders = [
  "Tanggal sesi",
  "Kelas",
  "Mata pelajaran",
  "Nama siswa",
  "NIM",
  "Status",
  "Menit terlambat",
  "Waktu scan",
];
const exportConcurrency = { active: 0, limit: 2 };

async function acquireExportSlot() {
  if (exportConcurrency.active >= exportConcurrency.limit)
    throw new AppError(
      429,
      "EXPORT_BUSY",
      "Terlalu banyak export sedang diproses. Silakan coba lagi nanti.",
    );
  exportConcurrency.active += 1;
}

function releaseExportSlot() {
  exportConcurrency.active -= 1;
}

function formatSchoolDate(value, timezone) {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: timezone,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(value);
}

function exportFileName(query) {
  const from = query.from
    ? new Date(query.from).toISOString().slice(0, 10).replaceAll("-", "")
    : "awal";
  const to = query.to
    ? new Date(query.to).toISOString().slice(0, 10).replaceAll("-", "")
    : "akhir";
  return `laporan-kehadiran-${from}-${to}.xlsx`;
}

export function createAttendanceService({
  repository,
  env,
  now = () => new Date(),
}) {
  return {
    async createSession(user, data) {
      if (user.role !== "TEACHER")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya guru yang dapat membuat sesi absensi.",
        );
      const assignment = await repository.findActiveAssignmentForTeacher(
        data.assignmentId,
        user.id,
      );
      if (!assignment)
        throw new AppError(
          403,
          "ASSIGNMENT_FORBIDDEN",
          "Penugasan tidak aktif atau bukan milik Anda.",
        );
      const times = normalizeSessionTimes(data, env.SCHOOL_TIMEZONE);
      try {
        const session = await repository.createSession({
          assignmentId: assignment.id,
          classId: assignment.classId,
          sessionDate: times.sessionDate,
          startAt: times.startAt,
          endAt: times.endAt,
          qrPayload: createQrPayload(),
          createdById: user.id,
        });
        return sessionMetadata(session);
      } catch (error) {
        if (error?.code === "P2002")
          throw new AppError(
            409,
            "DUPLICATE_ATTENDANCE_SESSION",
            "Sesi absensi untuk pertemuan tersebut sudah ada.",
          );
        throw error;
      }
    },
    async listSessions(user) {
      requireReader(user);
      const sessions =
        user.role === "ADMIN"
          ? await repository.listAllSessions()
          : await repository.listSessionsForTeacher(user.id);
      return sessions.map(sessionMetadata);
    },
    async getQr(user, id) {
      requireReader(user);
      const session = await repository.findSessionForReader(id, user);
      if (!session)
        throw new AppError(404, "NOT_FOUND", "Sesi absensi tidak ditemukan.");
      return { ...sessionMetadata(session), qrPayload: session.qrPayload };
    },
    async todaySchedule(user) {
      if (user.role !== "STUDENT")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya siswa yang dapat melihat jadwal hari ini.",
        );
      const nowValue = now();
      const { year, month, day } = localDate(
        nowValue,
        env.SCHOOL_TIMEZONE,
      );
      const sessionDate = new Date(
        `${year}-${month}-${day}T00:00:00.000Z`,
      );
      const sessions = await repository.listTodaySessionsForStudent(
        user.id,
        sessionDate,
      );
      return sessions.map((session) =>
        scheduleItem(
          session,
          classifyScheduleItem({
            startAt: session.startAt,
            endAt: session.endAt,
            now: nowValue,
            record: session.records?.[0] ?? null,
          }),
        ),
      );
    },
    async scan(user, data) {
      if (!isOpaqueQrPayload(data.qrPayload))
        throw new AppError(400, "INVALID_QR_PAYLOAD", "QR Code tidak valid.");

      const session = await repository.findSessionForScan(data.qrPayload);
      if (!session)
        throw new AppError(
          404,
          "ATTENDANCE_SESSION_NOT_FOUND",
          "Sesi absensi tidak ditemukan.",
        );
      if (!session.assignment?.isActive)
        throw new AppError(
          404,
          "ATTENDANCE_SESSION_NOT_FOUND",
          "Sesi absensi tidak ditemukan.",
        );

      const membership = await repository.findActiveMembership(
        session.classId,
        user.id,
      );
      if (!membership)
        throw new AppError(
          403,
          "CLASS_MEMBERSHIP_REQUIRED",
          "Anda bukan anggota kelas sesi ini.",
        );

      const scannedAt = now();
      let attendance;
      try {
        attendance = classifyAttendanceScan({
          startAt: session.startAt,
          endAt: session.endAt,
          scanAt: scannedAt,
        });
      } catch (error) {
        if (error instanceof RangeError)
          throw new AppError(
            409,
            "ATTENDANCE_WINDOW_CLOSED",
            "Sesi absensi belum dibuka atau sudah ditutup.",
          );
        throw error;
      }

      try {
        const record = await repository.createAttendanceRecord({
          sessionId: session.id,
          studentId: user.id,
          scannedAt,
          status: attendance.status,
          lateMinutes: attendance.lateMinutes,
        });
        return scanMetadata(record);
      } catch (error) {
        if (error?.code !== "P2002") throw error;
        const existing = await repository.findAttendanceRecord(
          session.id,
          user.id,
        );
        if (!existing) throw error;
        return scanMetadata(existing, true);
      }
    },
    async history(user, query) {
      if (user.role !== "STUDENT")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya siswa yang dapat melihat riwayat pribadi.",
        );
      return this.listReport(user, query, { studentId: user.id });
    },
    async classAttendance(user, query, classId) {
      if (user.role !== "TEACHER")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya guru yang dapat melihat detail kehadiran kelas.",
        );
      return this.listReport(user, query, { classId });
    },
    async globalReport(user, query) {
      if (user.role !== "ADMIN")
        throw new AppError(
          403,
          "FORBIDDEN",
          "Hanya admin yang dapat melihat laporan global.",
        );
      return this.listReport(user, query);
    },
    async exportReport(user, query) {
      if (!["ADMIN", "TEACHER"].includes(user.role))
        throw new AppError(
          403,
          "FORBIDDEN",
          "Anda tidak memiliki akses export laporan.",
        );
      await acquireExportSlot();
      try {
        const reportQuery = {
          page: 1,
          limit: 100,
          sort: "sessionDate",
          order: "desc",
          ...query,
        };
        const sessions = await repository.listExportSessions({
          user,
          query: reportQuery,
          classId: user.role === "TEACHER" ? query.classId : undefined,
        });
        const rows = sessions.flatMap((session) =>
          session.class.memberships.flatMap(({ student }) => {
            const record = session.records.find(
              (value) => value.studentId === student.id,
            );
            const status =
              record?.status ?? (now() > session.endAt ? "TIDAK_HADIR" : null);
            if (
              !status ||
              (reportQuery.status && reportQuery.status !== status)
            )
              return [];
            return [reportMetadata({ session, student, record, status })];
          }),
        );
        if (rows.length === 0)
          throw new AppError(
            404,
            "NO_DATA_TO_EXPORT",
            "Tidak ada data untuk diekspor.",
          );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Kehadiran");
        worksheet.columns = exportHeaders.map((header) => ({
          header,
          key: header,
          width: Math.max(header.length + 2, 18),
        }));
        rows.forEach((row) =>
          worksheet.addRow({
            [exportHeaders[0]]: formatSchoolDate(
              row.sessionDate,
              env.SCHOOL_TIMEZONE,
            ),
            [exportHeaders[1]]: row.className,
            [exportHeaders[2]]: row.subjectName,
            [exportHeaders[3]]: row.studentName,
            [exportHeaders[4]]: row.studentNumber,
            [exportHeaders[5]]: row.status,
            [exportHeaders[6]]: row.lateMinutes,
            [exportHeaders[7]]: formatSchoolDate(
              row.scannedAt,
              env.SCHOOL_TIMEZONE,
            ),
          }),
        );
        worksheet.getRow(1).font = { bold: true };
        return {
          buffer: await workbook.xlsx.writeBuffer(),
          fileName: exportFileName(reportQuery),
        };
      } finally {
        releaseExportSlot();
      }
    },
    async listReport(user, query, scope = {}) {
      const reportQuery = {
        page: 1,
        limit: 20,
        sort: "sessionDate",
        order: "desc",
        ...query,
      };
      const [sessions, total] = await repository.listReportSessions({
        user,
        query: reportQuery,
        ...scope,
      });
      const nowValue = now();
      const items = sessions.flatMap((session) => {
        const students = scope.studentId
          ? session.class.memberships
              .filter((membership) => membership.studentId === scope.studentId)
              .map((membership) => membership.student)
          : session.class.memberships.map((membership) => membership.student);
        return students.flatMap((student) => {
          const record = session.records.find(
            (value) => value.studentId === student.id,
          );
          const status =
            record?.status ?? (nowValue > session.endAt ? "TIDAK_HADIR" : null);
          if (!status || (reportQuery.status && reportQuery.status !== status))
            return [];
          return [reportMetadata({ session, student, record, status })];
        });
      });
      return pageResult(items, reportQuery, total);
    },
  };
}
