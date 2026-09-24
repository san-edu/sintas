import { SignJWT } from "jose";

function cookieOptions(env) {
  return [
    `HttpOnly`,
    `Path=/`,
    `SameSite=Lax`,
    env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function setAuthCookie(res, env, token) {
  res.append(
    "Set-Cookie",
    `${env.AUTH_COOKIE_NAME}=${token}; ${cookieOptions(env)}`,
  );
}

export function createAuthController({ service, env, authenticate }) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const issueToken = (user) =>
    new SignJWT({ username: user.username, role: user.role })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(String(user.id))
      .setIssuer(env.JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(env.ACCESS_TOKEN_TTL)
      .sign(secret);

  return {
    authenticate,
    async login(req, res, next) {
      try {
        const user = await service.login(req.body);
        setAuthCookie(res, env, await issueToken(user));
        res.json({ data: { user } });
      } catch (error) {
        next(error);
      }
    },
    logout(_req, res) {
      res.append(
        "Set-Cookie",
        `${env.AUTH_COOKIE_NAME}=; Max-Age=0; ${cookieOptions(env)}`,
      );
      res.json({ data: { message: "Logout berhasil." } });
    },
    async forgotPassword(req, res, next) {
      try {
        const data = await service.forgotPassword(req.body);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    },
    async me(req, res, next) {
      try {
        res.json({ data: { user: await service.getProfile(req.user.id) } });
      } catch (error) {
        next(error);
      }
    },
    async updateMe(req, res, next) {
      try {
        res.json({
          data: { user: await service.updateProfile(req.user.id, req.body) },
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
