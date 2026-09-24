import { AppError } from "../middleware/errorHandler.js";

export function createHealthRouter({ prisma }) {
  return {
    live(_req, res) {
      res.json({ data: { status: "ok" } });
    },
    async ready(_req, res, next) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ data: { status: "ready" } });
      } catch (error) {
        next(
          new AppError(
            503,
            "NOT_READY",
            "Database belum siap menerima traffic.",
            undefined,
            { cause: error },
          ),
        );
      }
    },
  };
}
