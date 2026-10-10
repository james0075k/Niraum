/** `pnpm --filter backend migrate` — runs every migration (each one is idempotent). */
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { MIGRATION_ID, localizeFields } from './2026-10-localize-fields.js';

export async function runMigrations() {
  const report = await localizeFields();
  logger.info({ migration: MIGRATION_ID, ...report }, 'Migration done');
  return report;
}

if (process.argv[1] && /migrations[\\/]run\.(ts|js)$/.test(process.argv[1])) {
  (async () => {
    await connectDb(env.MONGODB_URI, 3);
    await runMigrations();
    await disconnectDb();
  })().catch(async (err: unknown) => {
    logger.fatal({ err }, 'Migration failed');
    await disconnectDb().catch(() => undefined);
    process.exit(1);
  });
}
