import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";

const logger = { error: vi.fn() };

describe("health routes", () => {
  it("reports a live process without database access", async () => {
    const prisma = { $queryRaw: vi.fn() };
    const response = await request(createApp({ prisma, logger })).get(
      "/health/live",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok" } });
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it("reports readiness only when the database responds", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]) };
    const response = await request(createApp({ prisma, logger })).get(
      "/health/ready",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ready" } });
  });

  it("returns the consistent error shape when readiness fails", async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error("database unavailable")),
    };
    const response = await request(createApp({ prisma, logger })).get(
      "/health/ready",
    );

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: {
        code: "NOT_READY",
        message: "Database belum siap menerima traffic.",
      },
    });
  });

  it("returns the consistent error shape for unknown routes", async () => {
    const response = await request(createApp({ prisma: {}, logger })).get(
      "/missing",
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan." },
    });
  });
});
