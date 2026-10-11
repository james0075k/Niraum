import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { startPublishWatch } from './jobs/publishWatch.js';

async function main() {
  await connectDb();
  const app = createApp();
  const server: Server = app.listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`));
  const stopPublishWatch = startPublishWatch();

  let closing = false;
  const shutdown = (signal: string) => {
    if (closing) return;
    closing = true;
    logger.info({ signal }, 'Shutting down');
    stopPublishWatch();
    // Stop accepting connections, let in-flight requests finish, then close Mongo.
    server.close(async () => {
      await disconnectDb().catch((err: unknown) => logger.error({ err }, 'Mongo close failed'));
      process.exit(0);
    });
    server.closeIdleConnections();
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => logger.error({ err }, 'Unhandled rejection'));
}

main().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
