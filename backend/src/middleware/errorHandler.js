import { logger as defaultLogger } from '../config/logger.js'

export class AppError extends Error {
  constructor(statusCode, code, message, fieldErrors) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function errorHandler(error, req, res, next, logger = defaultLogger) {
  if (res.headersSent) {
    next(error)
    return
  }

  const isExpected = error instanceof AppError
  const isRateLimited = error.status === 429
  const statusCode = isExpected ? error.statusCode : (isRateLimited ? 429 : 500)
  const response = {
    error: {
      code: isExpected ? error.code : (isRateLimited ? 'RATE_LIMITED' : 'INTERNAL_SERVER_ERROR'),
      message: isExpected ? error.message : (isRateLimited ? 'Terlalu banyak percobaan. Silakan coba lagi nanti.' : 'Terjadi kesalahan pada server.'),
    },
  }

  if (isExpected && error.fieldErrors) {
    response.error.fieldErrors = error.fieldErrors
  }

  logger.error({
    err: error,
    requestId: req.requestId,
    statusCode,
  }, 'request failed')

  res.status(statusCode).json(response)
}