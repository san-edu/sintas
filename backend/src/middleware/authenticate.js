import { jwtVerify } from 'jose'
import { AppError } from './errorHandler.js'

function readCookie(header, name) {
  return header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)
}

export function createAuthenticate({ env }) {
  const secret = new TextEncoder().encode(env.JWT_SECRET)
  return async (req, _res, next) => {
    try {
      const token = readCookie(req.headers.cookie, env.AUTH_COOKIE_NAME)
      if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak valid atau sudah berakhir.')
      const { payload } = await jwtVerify(token, secret, { issuer: env.JWT_ISSUER })
      req.user = { id: Number(payload.sub), username: payload.username, role: payload.role }
      next()
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak valid atau sudah berakhir.'))
    }
  }
}
