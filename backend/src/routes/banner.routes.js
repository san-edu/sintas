import { Router } from 'express'
import { createBannerRepository } from '../repositories/banner.repository.js'
import { createBannerService } from '../services/banner.service.js'
import { createBannerController } from '../controllers/banner.controller.js'
import { createAuthenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema } from '../schemas/common.schemas.js'
import { activeBannerQuerySchema, bannerListSchema, bannerPatchSchema, bannerSchema } from '../schemas/banner.schemas.js'

export function createBannerRouter({ prisma, env }) {
  const router = Router()
  const authenticate = createAuthenticate({ env })
  const service = createBannerService({ repository: createBannerRepository(prisma) })
  const controller = createBannerController({ service })
  const admin = [authenticate, authorize('ADMIN')]
  router.get('/', authenticate, validate(activeBannerQuerySchema, 'query'), controller.listActive)
  router.get('/manage', ...admin, validate(bannerListSchema, 'query'), controller.listAll)
  router.post('/', ...admin, validate(bannerSchema), controller.create)
  router.patch('/:id', ...admin, validate(idParamSchema, 'params'), validate(bannerPatchSchema), controller.update)
  router.delete('/:id', ...admin, validate(idParamSchema, 'params'), controller.delete)
  return router
}
