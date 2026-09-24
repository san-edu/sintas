export function createBannerController({ service }) {
  const run = (action) => async (req, res, next) => { try { res.json({ data: await action(req) }) } catch (error) { next(error) } }
  return {
    listActive: run((req) => service.listActive(req.user, req.query.at)),
    listAll: run((req) => service.listAll(req.user, req.query)),
    create: run((req) => service.create(req.user, req.body)),
    update: run((req) => service.update(req.user, Number(req.params.id), req.body)),
    delete: run((req) => service.delete(req.user, Number(req.params.id))),
  }
}
