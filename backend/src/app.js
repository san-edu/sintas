import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { prisma as defaultPrisma } from "./config/database.js";
import { getEnv } from "./config/env.js";
import { AppError, errorHandler } from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import { csrfProtection } from "./middleware/csrf.js";
import { createRoutes } from "./routes/index.js";

export function createApp({
  prisma = defaultPrisma,
  logger,
  env: configuredEnv,
} = {}) {
  const app = express();
  const env = configuredEnv ?? getEnv();

  app.disable("x-powered-by");
  app.use(helmet());
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
    origin.trim(),
  );
  app.use(
    cors({
      origin: (origin, callback) =>
        callback(null, !origin || allowedOrigins.includes(origin)),
      credentials: true,
    }),
  );
  app.use(requestId);
  app.use((req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent)
        next(
          new AppError(
            408,
            "REQUEST_TIMEOUT",
            "Permintaan terlalu lama diproses.",
          ),
        );
    }, env.REQUEST_TIMEOUT_MS ?? 10000);
    res.on("finish", () => clearTimeout(timer));
    next();
  });
  app.use(
    csrfProtection({ allowedOrigins, authCookieName: env.AUTH_COOKIE_NAME }),
  );
  app.use(express.json({ limit: "100kb" }));
  const rateLimitOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(
        new AppError(
          429,
          "RATE_LIMITED",
          "Terlalu banyak percobaan. Silakan coba lagi nanti.",
        ),
      ),
  };
  app.use("/api/v1/auth/login", rateLimit({ ...rateLimitOptions, limit: 10 }));
  app.use(
    "/api/v1/auth/forgot-password",
    rateLimit({ ...rateLimitOptions, limit: 5 }),
  );
  app.use(
    "/api/v1/attendance-scans",
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.SCAN_RATE_LIMIT ?? 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, _res, next) =>
        next(
          new AppError(
            429,
            "RATE_LIMITED",
            "Terlalu banyak percobaan scan. Silakan coba lagi nanti.",
          ),
        ),
    }),
  );
  app.use(createRoutes({ prisma, env }));
  app.use((_req, _res, next) =>
    next(new AppError(404, "NOT_FOUND", "Endpoint tidak ditemukan.")),
  );
  app.use((error, req, res, next) =>
    errorHandler(error, req, res, next, logger),
  );

  return app;
}
