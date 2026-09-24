import argon2 from "argon2";
import { SignJWT } from "jose";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app.js";
import { createAuthenticate } from "../../src/middleware/authenticate.js";
import { authorize } from "../../src/middleware/authorize.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";

const env = {
  NODE_ENV: "test",
  CORS_ORIGIN: "http://localhost:5173",
  JWT_SECRET: "test-secret-that-is-long-enough-for-jwt",
  JWT_ISSUER: "sintas-test",
  ACCESS_TOKEN_TTL: "15m",
  AUTH_COOKIE_NAME: "auth_token",
};

const user = {
  id: 1,
  username: "student.demo",
  passwordHash: await argon2.hash("password-123", { type: argon2.argon2id }),
  role: "STUDENT",
  name: "Siswa Demo",
  email: "student@example.test",
  phone: null,
  birthDate: new Date("2008-01-02T00:00:00.000Z"),
  studentProfile: { studentNumber: "S-0001" },
};

function createPrisma() {
  return {
    user: {
      findUnique: vi
        .fn()
        .mockImplementation(({ where }) =>
          where.username === user.username || where.id === user.id
            ? Promise.resolve(user)
            : Promise.resolve(null),
        ),
      findFirst: vi
        .fn()
        .mockImplementation(({ where }) =>
          where.birthDate.getTime() === user.birthDate.getTime()
            ? Promise.resolve(user)
            : Promise.resolve(null),
        ),
      update: vi
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ ...user, ...data }),
        ),
    },
  };
}

function createAuthTestApp(prisma = createPrisma()) {
  return {
    app: createApp({ prisma, env, logger: { error: vi.fn() } }),
    prisma,
  };
}

describe("auth HTTP flow", () => {
  it("logs in with valid credentials and sets an HttpOnly cookie", async () => {
    const { app } = createAuthTestApp();
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: user.username, password: "password-123" });
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.body.data.user).toMatchObject({
      username: user.username,
      role: "STUDENT",
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  it("uses a generic error for invalid login and rejects unauthenticated profile access", async () => {
    const { app } = createAuthTestApp();
    const invalid = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: user.username, password: "wrong-password" });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Username atau password tidak sesuai.",
    });
    const unauthenticated = await request(app).get("/api/v1/me");
    expect(unauthenticated.status).toBe(401);
  });

  it("rejects an expired session token", async () => {
    const { app } = createAuthTestApp();
    const token = await new SignJWT({
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(String(user.id))
      .setIssuer(env.JWT_ISSUER)
      .setExpirationTime(new Date("2000-01-01T00:00:00.000Z"))
      .sign(new TextEncoder().encode(env.JWT_SECRET));
    const response = await request(app)
      .get("/api/v1/me")
      .set("Cookie", `${env.AUTH_COOKIE_NAME}=${token}`);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects a role not allowed by the authorization middleware", async () => {
    const { app } = createAuthTestApp();
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: user.username, password: "password-123" });
    const roleApp = express();
    roleApp.get(
      "/role-check",
      createAuthenticate({ env }),
      authorize("ADMIN"),
      (_req, res) => res.json({ data: { ok: true } }),
    );
    roleApp.use((error, req, res, next) =>
      errorHandler(error, req, res, next, { error: vi.fn() }),
    );
    const response = await request(roleApp)
      .get("/role-check")
      .set("Cookie", login.headers["set-cookie"]);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("supports profile read/update and logout", async () => {
    const { app } = createAuthTestApp();
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: user.username, password: "password-123" });
    const profile = await request(app)
      .get("/api/v1/me")
      .set("Cookie", login.headers["set-cookie"]);
    expect(profile.status).toBe(200);
    const updated = await request(app)
      .patch("/api/v1/me")
      .set("Cookie", login.headers["set-cookie"])
      .send({ name: "Siswa Baru" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user.name).toBe("Siswa Baru");
    const logout = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", login.headers["set-cookie"]);
    expect(logout.status).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/v1/me")
          .set("Cookie", logout.headers["set-cookie"])
      ).status,
    ).toBe(401);
  });

  it("rejects cookie-auth mutations without a CSRF token when a browser origin is present", async () => {
    const { app } = createAuthTestApp();
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: user.username, password: "password-123" });
    const response = await request(app)
      .patch("/api/v1/me")
      .set("Cookie", login.headers["set-cookie"])
      .set("Origin", env.CORS_ORIGIN)
      .send({ name: "Blocked" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_TOKEN_INVALID");
  });

  it("rejects state-changing requests from an untrusted origin", async () => {
    const response = await request(createAuthTestApp().app)
      .post("/api/v1/auth/login")
      .set("Origin", "https://evil.example")
      .send({ username: user.username, password: "password-123" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_ORIGIN_REJECTED");
  });

  it("rejects reset mismatch and changes password for matching identity data", async () => {
    const { app } = createAuthTestApp();
    const mismatch = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: user.email,
        birthDate: "2008-01-03",
        password: "new-password",
        passwordConfirmation: "new-password",
      });
    expect(mismatch.status).toBe(400);
    const success = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({
        email: user.email,
        birthDate: "2008-01-02",
        password: "new-password",
        passwordConfirmation: "new-password",
      });
    expect(success.status).toBe(200);
  });
});
