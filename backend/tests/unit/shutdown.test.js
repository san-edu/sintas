import { describe, expect, it, vi } from 'vitest'
import { createShutdownHandler } from '../../src/server.js'

describe('graceful shutdown', () => {
  it('closes the HTTP server and disconnects Prisma once', async () => {
    const server = { close: vi.fn((callback) => callback()) }
    const prisma = { $disconnect: vi.fn().mockResolvedValue(undefined) }
    const logger = { info: vi.fn() }
    const shutdown = createShutdownHandler({ server, prisma, logger })

    await Promise.all([shutdown('SIGTERM'), shutdown('SIGINT')])

    expect(server.close).toHaveBeenCalledTimes(1)
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1)
  })
})