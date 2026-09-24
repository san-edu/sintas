import { Router } from 'express'
import { createManagementRepository } from '../repositories/management.repository.js'
import { createManagementService } from '../services/management.service.js'
import { createManagementController } from '../controllers/management.controller.js'
import { createAuthenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema } from '../schemas/common.schemas.js'
import { createUserSchema, resetUserPasswordSchema, userListSchema } from '../schemas/academic.schemas.js'

export function createUserRouter({ prisma, env }) {
  const router = Router()
  const authenticate = createAuthenticate({ env })
  const service = createManagementService({ repository: createManagementRepository(prisma) })
  const controller = createManagementController({ service })
  const admin = [authenticate, authorize('ADMIN')]
  router.get('/', ...admin, validate(userListSchema, 'query'), controller.listUsers)
  router.post('/', ...admin, validate(createUserSchema), controller.createUser)
  router.patch('/:id/password', ...admin, validate(idParamSchema, 'params'), validate(resetUserPasswordSchema), controller.resetPassword)
  return router
}
