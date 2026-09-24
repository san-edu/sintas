import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { prisma as defaultPrisma } from './config/database.js'
import { getEnv } from './config/env.js'
import { logger as defaultLogger } from './config/logger.js'

export function createShutdownHandler({ server, prisma = defaultPrisma, logger = defaultLogger }) {
  let isShuttingDown = false

  return async function shutdown(signal = 'manual') {
    if (isShuttingDown) return
    isShuttingDown = true
    logger.info({ signal }, 'shutting down')

    await new Promise((resolve) => server.close(resolve))
    await prisma.$disconnect()
  }
}

export async function startServer({ app = createApp(), port = getEnv().PORT, prisma = defaultPrisma, logger = defaultLogger } = {}) {
  const server = app.listen(port, () => logger.info({ port }, 'server started'))
  const shutdown = createShutdownHandler({ server, prisma, logger })

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  return { server, shutdown }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch((error) => {
    defaultLogger.fatal({ err: error }, 'server failed to start')
    process.exitCode = 1
  })
}