import { AppError } from '../middleware/errorHandler.js'

export function createBannerService({ repository }) {
  const adminOnly = (user) => { if (user.role !== 'ADMIN') throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses ke sumber daya ini.') }
  return {
    listActive(_user, at = new Date()) { return repository.listActive(at) },
    async listAll(user, query) {
      adminOnly(user)
      const [items, total] = await repository.listAll(query)
      return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } }
    },
    create(user, data) { adminOnly(user); return repository.create({ ...data, createdById: user.id }) },
    async update(user, id, data) {
      adminOnly(user)
      const current = await repository.findById(id)
      if (!current) throw new AppError(404, 'NOT_FOUND', 'Banner tidak ditemukan.')
      const merged = { ...current, ...data }
      if (merged.displayStartAt && merged.displayEndAt && merged.displayEndAt <= merged.displayStartAt) throw new AppError(400, 'VALIDATION_ERROR', 'Waktu akhir harus setelah waktu mulai.', { displayEndAt: 'Waktu akhir harus setelah waktu mulai.' })
      return repository.update(id, data)
    },
    async delete(user, id) { adminOnly(user); if (!await repository.findById(id)) throw new AppError(404, 'NOT_FOUND', 'Banner tidak ditemukan.'); return repository.delete(id) },
  }
}
