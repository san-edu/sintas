import { timingSafeEqual, randomBytes } from "node:crypto";
import { AppError } from "./errorHandler.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const tokenCookieName = "csrf_token";

function readCookie(header, name) {
  return header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function sameToken(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function csrfProtection({ allowedOrigins, authCookieName }) {
  return (req, res, next) => {
    let token = readCookie(req.headers.cookie, tokenCookieName);
    if (!token && SAFE_METHODS.has(req.method)) {
      token = randomBytes(32).toString("base64url");
      res.append(
        "Set-Cookie",
        `${tokenCookieName}=${token}; Path=/; SameSite=Lax`,
      );
    }

    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const origin = req.get("origin");
    if (origin && !allowedOrigins.includes(origin)) {
      next(
        new AppError(
          403,
          "CSRF_ORIGIN_REJECTED",
          "Origin request tidak diizinkan.",
        ),
      );
      return;
    }

    if (
      readCookie(req.headers.cookie, authCookieName) &&
      origin &&
      !sameToken(token, req.get("x-csrf-token"))
    ) {
      next(
        new AppError(
          403,
          "CSRF_TOKEN_INVALID",
          "Permintaan tidak dapat diverifikasi.",
        ),
      );
      return;
    }

    next();
  };
}
