import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().url(),
    CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
    SCHOOL_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    JWT_SECRET: z
      .string()
      .min(32)
      .default("development-only-jwt-secret-change-me-32"),
    JWT_ISSUER: z.string().min(1).default("sintas"),
    ACCESS_TOKEN_TTL: z.string().min(1).default("15m"),
    AUTH_COOKIE_NAME: z.string().min(1).default("auth_token"),
    REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(120000)
      .default(10000),
    SCAN_RATE_LIMIT: z.coerce.number().int().min(10).max(1000).default(120),
  })
  .superRefine((value, context) => {
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: value.SCHOOL_TIMEZONE,
      }).format();
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SCHOOL_TIMEZONE"],
        message: "Timezone sekolah harus berupa identifier IANA.",
      });
    }
    if (
      value.NODE_ENV === "production" &&
      value.JWT_SECRET === "development-only-jwt-secret-change-me-32"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET production wajib diganti.",
      });
    }
    if (
      value.NODE_ENV === "production" &&
      value.CORS_ORIGIN.includes("localhost")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGIN"],
        message: "CORS_ORIGIN production tidak boleh localhost.",
      });
    }
  });

export function parseEnv(values = process.env) {
  return envSchema.parse(values);
}

export function getEnv(values = process.env) {
  return parseEnv(values);
}
