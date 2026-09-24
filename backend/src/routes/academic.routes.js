import { Router } from 'express'
import { createAcademicRepository } from '../repositories/academic.repository.js'
import { createAcademicService } from '../services/academic.service.js'
import { createAcademicController } from '../controllers/academic.controller.js'
import { createAuthenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { idParamSchema } from '../schemas/common.schemas.js'
import { assignmentSchema, assignmentListSchema, classSchema, educationLevelSchema, listAcademicSchema, membershipListSchema, membershipSchema, statusSchema, subjectSchema } from '../schemas/academic.schemas.js'

export function createAcademicRouter({ prisma, env }) {
  const router = Router()
  const authenticate = createAuthenticate({ env })
  const service = createAcademicService({ repository: createAcademicRepository(prisma) })
  const controller = createAcademicController({ service })
  const admin = [authenticate, authorize('ADMIN')]
  const staff = [authenticate, authorize('ADMIN', 'TEACHER')]
  const id = [validate(idParamSchema, 'params')]

  router.get('/education-levels', ...admin, validate(listAcademicSchema, 'query'), controller.listEducationLevels)
  router.post('/education-levels', ...admin, validate(educationLevelSchema), controller.createEducationLevel)
  router.patch('/education-levels/:id', ...admin, ...id, validate(educationLevelSchema), controller.updateEducationLevel)
  router.delete('/education-levels/:id', ...admin, ...id, controller.deleteEducationLevel)
  router.get('/classes', ...staff, validate(listAcademicSchema, 'query'), controller.listClasses)
  router.post('/classes', ...admin, validate(classSchema), controller.createClass)
  router.patch('/classes/:id', ...admin, ...id, validate(classSchema), controller.updateClass)
  router.delete('/classes/:id', ...admin, ...id, controller.deleteClass)
  router.get('/subjects', ...staff, validate(listAcademicSchema, 'query'), controller.listSubjects)
  router.post('/subjects', ...admin, validate(subjectSchema), controller.createSubject)
  router.patch('/subjects/:id', ...admin, ...id, validate(subjectSchema), controller.updateSubject)
  router.delete('/subjects/:id', ...admin, ...id, controller.deleteSubject)
  router.post('/memberships', ...admin, validate(membershipSchema), controller.createMembership)
  router.get('/memberships', ...admin, validate(membershipListSchema, 'query'), controller.listMemberships)
  router.patch('/memberships/:id', ...admin, ...id, validate(statusSchema), controller.updateMembership)
  router.post('/assignments', ...admin, validate(assignmentSchema), controller.createAssignment)
  router.patch('/assignments/:id', ...admin, ...id, validate(statusSchema), controller.updateAssignment)
  router.get('/assignments', authenticate, authorize('TEACHER'), controller.listAssignments)
  router.get('/assignments/manage', ...admin, validate(assignmentListSchema, 'query'), controller.listAssignmentsManage)
  router.get('/my-classes', authenticate, authorize('STUDENT'), controller.listMyClasses)
  return router
}
