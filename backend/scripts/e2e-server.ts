/**
 * `pnpm --filter backend e2e:server` — the API for Playwright's admin project, on a throwaway
 * in-memory MongoDB (mongodb-memory-server). It never reads backend/.env and always overrides
 * MONGODB_URI, so it cannot touch Atlas or any other real database; everything is gone when the
 * process exits.
 *
 * Boot: start mongod → set a minimal development env (random JWT secrets, no captcha, no
 * Cloudinary/SMTP/rebuild hook, Nominatim pointed at a blocked local port so geocoding fails
 * fast and offline) → migrations + the normal seed + the e2e users → listen.
 *
 * Env: E2E_ADMIN_PASSWORD (required for the e2e users), E2E_ADMIN_EMAIL, E2E_API_PORT (4100),
 * E2E_WEB_URL (http://localhost:5174, allowed origin), E2E_NOMINATIM_URL (to geocode for real).
 */
import { randomBytes } from 'node:crypto';
import type { Server } from 'node:http';
import { MongoMemoryServer } from 'mongodb-memory-server';

if (process.env.NODE_ENV === 'production') {
  console.error('e2e:server refuses to run with NODE_ENV=production');
  process.exit(1);
}

const mongod = await MongoMemoryServer.create();
const secret = () => randomBytes(32).toString('hex');
const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:5174';

Object.assign(process.env, {
  NODE_ENV: 'development',
  PORT: process.env.E2E_API_PORT ?? '4100',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'warn',
  MONGODB_URI: mongod.getUri('niraum-e2e'),
  JWT_ACCESS_SECRET: secret(),
  JWT_REFRESH_SECRET: secret(),
  CLIENT_URL: webUrl,
  ADMIN_URL: webUrl,
  CORS_ORIGINS: '',
  // fetch() refuses port 9 ("bad port"): geocoding fails at once, offline → GEOCODE_FAILED.
  NOMINATIM_URL: process.env.E2E_NOMINATIM_URL ?? 'http://127.0.0.1:9',
});
// Nothing that could reach a real service.
for (const key of [
  'TURNSTILE_SECRET',
  'RECAPTCHA_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY',
  'REBUILD_HOOK_URL',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
]) {
  delete process.env[key];
}

// Imported only now: config/env.ts parses process.env at import time.
const { createApp } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
const { env } = await import('../src/config/env.js');
const { logger } = await import('../src/config/logger.js');
const { runMigrations } = await import('../src/migrations/run.js');
const { seedContent, seedSettings } = await import('../src/seed/index.js');
const { seedAssay } = await import('../src/seed/assay.seed.js');
const { seedFounder, seedKatujpani, seedProduct, seedSiteText } =
  await import('../src/seed/katujpani.seed.js');
const { seedE2eUsers } = await import('../src/seed/e2e-admin.seed.js');

await connectDb(env.MONGODB_URI, 1);
await runMigrations();
await seedSettings();
await seedContent();
await seedAssay();
await seedKatujpani();
await seedProduct();
await seedFounder();
await seedSiteText();
const users = await seedE2eUsers();
if (!users.length) logger.warn('E2E_ADMIN_PASSWORD not set — no e2e users created');

const server: Server = createApp().listen(env.PORT, () =>
  logger.warn(`e2e API on :${env.PORT} (in-memory MongoDB, ${users.length} e2e users)`),
);

let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  server.close();
  server.closeAllConnections();
  await disconnectDb().catch(() => undefined);
  await mongod.stop();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
