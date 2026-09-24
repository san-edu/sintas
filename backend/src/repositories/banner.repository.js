export function createBannerRepository(prisma) {
  return {
    create(data) { return prisma.banner.create({ data }) },
    findById(id) { return prisma.banner.findUnique({ where: { id } }) },
    update(id, data) { return prisma.banner.update({ where: { id }, data }) },
    delete(id) { return prisma.banner.delete({ where: { id } }) },
    listActive(at) { return prisma.banner.findMany({ where: { isActive: true, OR: [{ displayStartAt: null }, { displayStartAt: { lte: at } }], AND: [{ OR: [{ displayEndAt: null }, { displayEndAt: { gte: at } }] }] }, orderBy: { createdAt: 'desc' } }) },
    listAll(query) {
      const where = {};
      if (query.isActive !== undefined) where.isActive = query.isActive;
      if (query.search) where.title = { contains: query.search };
      const { page, limit, order } = query;
      return Promise.all([
        prisma.banner.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: order },
        }),
        prisma.banner.count({ where }),
      ]);
    },
  }
}
