export function createAcademicController({ service }) {
  const run = (action) => async (req, res, next) => { try { res.json({ data: await action(req) }) } catch (error) { next(error) } }
  return {
    listEducationLevels: run((req) => service.listEducationLevels(req.user, req.query)),
    createEducationLevel: run((req) => service.createEducationLevel(req.user, req.body)),
    updateEducationLevel: run((req) => service.updateEducationLevel(req.user, Number(req.params.id), req.body)),
    deleteEducationLevel: run((req) => service.deleteEducationLevel(req.user, Number(req.params.id))),
    listClasses: run((req) => service.listClasses(req.user, req.query)),
    createClass: run((req) => service.createClass(req.user, req.body)),
    updateClass: run((req) => service.updateClass(req.user, Number(req.params.id), req.body)),
    deleteClass: run((req) => service.deleteClass(req.user, Number(req.params.id))),
    listSubjects: run((req) => service.listSubjects(req.user, req.query)),
    createSubject: run((req) => service.createSubject(req.user, req.body)),
    updateSubject: run((req) => service.updateSubject(req.user, Number(req.params.id), req.body)),
    deleteSubject: run((req) => service.deleteSubject(req.user, Number(req.params.id))),
    createMembership: run((req) => service.createMembership(req.user, req.body)),
    updateMembership: run((req) => service.updateMembership(req.user, Number(req.params.id), req.body)),
    createAssignment: run((req) => service.createAssignment(req.user, req.body)),
    updateAssignment: run((req) => service.updateAssignment(req.user, Number(req.params.id), req.body)),
    listAssignments: run((req) => service.listAssignments(req.user)),
    listMemberships: run((req) => service.listMemberships(req.user, req.query)),
    listAssignmentsManage: run((req) => service.listAssignmentsManage(req.user, req.query)),
    listMyClasses: run((req) => service.listMyClasses(req.user)),
  }
}
