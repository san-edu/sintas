import { Router } from 'express'
import { createUserRepository } from '../repositories/user.repository.js'
import { createAuthService } from '../services/auth/auth.service.js'
import { createAuthController } from '../controllers/auth.controller.js'
import { createAuthenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { forgotPasswordSchema, loginSchema, profileSchema } from '../schemas/auth.schemas.js'

export function createAuthRouter({ prisma, env }) {
  const router = Router()
  const authenticate = createAuthenticate({ env })
  const service = createAuthService({ userRepository: createUserRepository(prisma) })
  const controller = createAuthController({ service, env, authenticate })

  router.post('/login', validate(loginSchema), controller.login)
  router.post('/logout', controller.logout)
  router.post('/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword)

  router.me = [authenticate, controller.me]
  router.updateMe = [authenticate, validate(profileSchema), controller.updateMe]
  return router
}
