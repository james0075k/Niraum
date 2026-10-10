/**
 * `pnpm seed` — idempotent. Creates:
 *  1. the first superadmin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (must change password
 *     on first login);
 *  2. the SiteSettings singleton with the Lalitpur-13 address, geocoded through Nominatim.
 *     The pin stays `approximate` until an admin confirms it on the map;
 *  3. SAMPLE services, projects and posts (./content.ts) — only into empty collections, so it
 *     never duplicates or resurrects content an admin has edited or deleted.
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Post } from '../models/Post.js';
import { Project } from '../models/Project.js';
import { Service } from '../models/Service.js';
import { SETTINGS_ID, SiteSettings } from '../models/SiteSettings.js';
import { User } from '../models/User.js';
import { hashPassword } from '../services/auth.service.js';
import { geocodeService } from '../services/geocode.service.js';
import { settingsService } from '../services/settings.service.js';
import { samplePosts, sampleProjects, sampleServices } from './content.js';

export async function seedAdmin(): Promise<'created' | 'exists' | 'skipped'> {
  const { SEED_ADMIN_EMAIL: email, SEED_ADMIN_PASSWORD: password, SEED_ADMIN_NAME: name } = env;
  if (!email || !password) {
    logger.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — no admin created');
    return 'skipped';
  }
  if (await User.exists({ email })) return 'exists';
  await User.create({
    name,
    email,
    role: 'superadmin',
    passwordHash: await hashPassword(password),
    mustChangePassword: true,
  });
  return 'created';
}

export async function seedSettings(): Promise<string> {
  const settings = await settingsService.get();
  if (settings.location.manualOverride || settings.location.geocodedAt) return 'unchanged';

  const result = await geocodeService.geocodeAddress(settings.address);
  if (!result.ok) return `geocode ${result.reason} — kept fallback pin`;
  await SiteSettings.updateOne(
    { _id: SETTINGS_ID },
    {
      'location.lat': result.lat,
      'location.lng': result.lng,
      'location.approximate': true, // admin confirms the exact pin
      'location.geocodedAt': new Date(),
    },
  );
  return `geocoded "${result.query}" → ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`;
}

type SeedCount = number | 'exists';

/**
 * Sample content for a fresh database. A collection with any document — including
 * soft-deleted ones — is left alone.
 */
export async function seedContent(): Promise<Record<'services' | 'projects' | 'posts', SeedCount>> {
  const now = new Date();
  const fill = async (count: () => Promise<number>, insert: () => Promise<unknown[]>) =>
    (await count()) > 0 ? ('exists' as const) : (await insert()).length;

  return {
    services: await fill(
      () => Service.countDocuments(),
      () => Service.insertMany(sampleServices.map((s) => ({ ...s, published: true }))),
    ),
    projects: await fill(
      () => Project.countDocuments(),
      () =>
        Project.insertMany(
          sampleProjects.map((p) => ({ ...p, published: true, publishedAt: now, isSample: true })),
        ),
    ),
    posts: await fill(
      () => Post.countDocuments(),
      () => Post.insertMany(samplePosts.map((p) => ({ ...p, published: true, isSample: true }))),
    ),
  };
}

async function main() {
  await connectDb(env.MONGODB_URI, 3);
  const admin = await seedAdmin();
  logger.info({ admin }, 'Superadmin');
  logger.info({ location: await seedSettings() }, 'Site settings');
  logger.info(await seedContent(), 'Sample content');
  await disconnectDb();
}

// Run only when executed directly (tests import the functions).
if (process.argv[1] && /seed[\\/]index\.(ts|js)$/.test(process.argv[1])) {
  main().catch(async (err: unknown) => {
    logger.fatal({ err }, 'Seed failed');
    await disconnectDb().catch(() => undefined);
    process.exit(1);
  });
}
